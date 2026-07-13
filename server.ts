import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

// Prefer the local development file documented in the README, then fall back
// to a standard .env file when a deployment platform provides one.
dotenv.config({ path: '.env.local' });
dotenv.config();

const MAX_PROMPT_LENGTH = 6_000;
const AI_REQUEST_LIMIT = 10;
const AI_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const AI_REQUEST_TIMEOUT_MS = 30_000;

const mentorSystemInstruction = `Você é um mentor de cibersegurança didático para iniciantes em programação.
Explique conceitos de forma prática, priorizando defesa, programação segura e uso ético.
Recuse instruções que facilitem ataques a sistemas reais, roubo de dados, evasão, malware ou atividade sem autorização.
Quando relevante, indique que testes só devem ocorrer em laboratórios próprios ou com autorização expressa.
Responda em português brasileiro, com exemplos curtos e seguros.`;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const aiRateLimit = new Map<string, RateLimitEntry>();

function consumeAiRateLimit(clientId: string) {
  const now = Date.now();

  if (aiRateLimit.size > 1_000) {
    for (const [key, entry] of aiRateLimit) {
      if (entry.resetAt <= now) aiRateLimit.delete(key);
    }
  }

  const existing = aiRateLimit.get(clientId);
  const entry = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + AI_RATE_LIMIT_WINDOW_MS }
    : existing;

  if (entry.count >= AI_REQUEST_LIMIT) {
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1_000) };
  }

  entry.count += 1;
  aiRateLimit.set(clientId, entry);

  return {
    allowed: true,
    remaining: AI_REQUEST_LIMIT - entry.count,
    retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1_000)
  };
}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number, errorMessage: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    operation.then(
      (result) => {
        clearTimeout(timeout);
        resolve(result);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';

  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
    if (isProd) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  app.use((req, _res, next) => {
    console.log(`[Express] Request received: ${req.method} ${req.url}`);
    next();
  });

  // The system instruction stays on the server so callers cannot replace the
  // application's safety and teaching boundaries.
  app.post('/api/gemini', async (req, res) => {
    try {
      const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
      if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
        return res.status(400).json({ error: `Envie uma pergunta entre 1 e ${MAX_PROMPT_LENGTH} caracteres.` });
      }

      const rateLimit = consumeAiRateLimit(req.ip || req.socket.remoteAddress || 'unknown');
      res.setHeader('X-RateLimit-Limit', String(AI_REQUEST_LIMIT));
      res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
      if (!rateLimit.allowed) {
        res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
        return res.status(429).json({ error: 'Limite temporário de perguntas atingido. Tente novamente em alguns minutos.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'O mentor IA está indisponível no momento.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'secacademy',
          }
        }
      });

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: { systemInstruction: mentorSystemInstruction },
        }),
        AI_REQUEST_TIMEOUT_MS,
        'Gemini request timed out'
      );

      if (!response.text) {
        return res.status(502).json({ error: 'O mentor não retornou uma resposta. Tente novamente.' });
      }

      res.setHeader('Cache-Control', 'no-store');
      res.json({ text: response.text });
    } catch (error: unknown) {
      console.error('Erro na chamada do Gemini:', error);
      res.status(502).json({ error: 'Não foi possível obter uma resposta do mentor IA. Tente novamente.' });
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ error: 'O corpo da requisição não é um JSON válido.' });
    }
    next(error);
  });

  if (isProd) {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      console.log(`[DevServer] GET request received for: ${url}`);
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (error: unknown) {
        console.error('[DevServer] Error rendering index.html:', error);
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Server] Servidor rodando em http://localhost:${port} (isProd: ${isProd})`);
  });
}

startServer().catch((error: unknown) => {
  console.error('[Server] Falha ao iniciar o servidor:', error);
});
