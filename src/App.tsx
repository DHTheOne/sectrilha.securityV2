import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, 
  Terminal, 
  BookOpen, 
  Code, 
  Tv, 
  MessageSquare, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  Eye, 
  Search, 
  Cpu, 
  Globe, 
  Server, 
  ExternalLink,
  ChevronRight,
  BookMarked,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Award,
  XCircle,
  LogIn,
  LogOut,
  Flame
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { auth, db, googleProvider } from './firebase';
import {
  calculateActiveStreak,
  getLocalDateString,
  LEARNING_NODE_IDS,
  readStoredLongestStreak,
  readStoredNodeIds,
  readStoredStudyDates,
  sanitizeNodeIds,
  sanitizeStudyDates
} from './progress';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

const quizData: Record<string, QuizQuestion[]> = {
  'net-basics': [
    {
      question: 'Qual é a função de uma porta lógica de rede, como a porta 443?',
      options: [
        'A) Realizar o ping para testar se o computador remoto está ligado.',
        'B) Direcionar o tráfego de rede recebido para o serviço específico correto (HTTPS, neste caso).',
        'C) Criptografar automaticamente todos os arquivos contidos no disco rígido.',
        'D) Gerar endereços IP aleatórios para navegação anônima.'
      ],
      correctAnswerIndex: 1,
      explanation: 'As portas lógicas de rede funcionam como ramais ou apartamentos em um condomínio. O endereço IP diz qual é o prédio (a máquina), enquanto a porta diz a qual apartamento (o serviço) a mensagem se destina.'
    },
    {
      question: 'O que significa o utilitário "ping" retornar sucesso em suas requisições ICMP?',
      options: [
        'A) Que o servidor web da máquina alvo está vulnerável a injeção SQL.',
        'B) Que o arquivo requisitado está totalmente criptografado com AES-256.',
        'C) Que o host remoto está ativo na rede e respondendo às requisições de eco básicas.',
        'D) Que o tráfego de dados está completamente protegido contra escutas.'
      ],
      correctAnswerIndex: 2,
      explanation: 'O utilitário ping envia pacotes de requisição de eco ICMP (Internet Control Message Protocol). Se o host remoto responde com sucesso, sabemos que ele está online e ativo na rede.'
    },
    {
      question: 'No modelo TCP/IP, qual protocolo garante que os pacotes sejam entregues na ordem correta e sem perdas?',
      options: [
        'A) UDP (User Datagram Protocol)',
        'B) IP (Internet Protocol)',
        'C) TCP (Transmission Control Protocol)',
        'D) ICMP (Internet Control Message Protocol)'
      ],
      correctAnswerIndex: 2,
      explanation: 'O TCP é um protocolo orientado à conexão, o que significa que ele estabelece uma sessão estável, confirma o recebimento de cada pacote, reordena-os se chegarem bagunçados e reenvia dados perdidos.'
    }
  ],
  'linux-bash': [
    {
      question: 'Qual comando é usado para alterar as permissões de um script no Linux, permitindo que ele seja executado?',
      options: [
        'A) ls -la script.sh',
        'B) chmod +x script.sh',
        'C) tar -czf script.sh',
        'D) grep script.sh'
      ],
      correctAnswerIndex: 1,
      explanation: 'O comando "chmod" (change mode) é o utilitário do Linux usado para alterar as permissões de acesso e execução. A flag "+x" concede permissão de execução (execute) ao arquivo.'
    },
    {
      question: 'Qual é a utilidade do comando "grep" no terminal Linux?',
      options: [
        'A) Criar um backup compactado de arquivos do sistema.',
        'B) Buscar por padrões de texto específicos ou expressões regulares dentro de arquivos de forma rápida.',
        'C) Testar a latência de rede até um servidor web remoto.',
        'D) Excluir diretórios de forma recursiva.'
      ],
      correctAnswerIndex: 1,
      explanation: 'O grep é um filtro de texto fantástico que varre linhas de arquivos procurando por correspondências de termos ou expressões regulares informadas.'
    },
    {
      question: 'O que acontece ao rodar o comando "find /etc -maxdepth 1 -mtime -1" no terminal?',
      options: [
        'A) Ele apaga os arquivos de configuração do sistema criados ontem.',
        'B) Ele busca por arquivos no diretório /etc modificados no último dia (últimas 24 horas) sem descer em subpastas.',
        'C) Ele compacta a pasta /etc para liberar espaço em disco.',
        'D) Ele reinicia o serviço de terminal Bash.'
      ],
      correctAnswerIndex: 1,
      explanation: 'O utilitário "find" busca por arquivos. O parâmetro "-mtime -1" filtra os arquivos modificados a menos de 1 dia (últimas 24h), e "-maxdepth 1" limita a pesquisa estritamente à pasta atual, sem pesquisar subpastas.'
    }
  ],
  'python-sec': [
    {
      question: 'No desenvolvimento de um Port Scanner em Python, por que é importante configurar "socket.settimeout(0.5)"?',
      options: [
        'A) Para cifrar os pacotes de rede transmitidos.',
        'B) Para evitar que o scanner trave aguardando conexões em portas fechadas ou filtradas por muito tempo.',
        'C) Para mascarar o endereço IP de quem está fazendo o scanner.',
        'D) Para acelerar os clocks de frequência da CPU.'
      ],
      correctAnswerIndex: 1,
      explanation: 'Se não limitarmos o tempo de espera, o socket do Python pode ficar esperando uma resposta de uma porta filtrada ou fechada por até 30 segundos, tornando o scanner extremamente lento.'
    },
    {
      question: 'Qual método da biblioteca "socket" permite testar uma conexão retornando apenas um número de status de erro (0 para sucesso) sem levantar exceções?',
      options: [
        'A) socket.connect()',
        'B) socket.connect_ex()',
        'C) socket.sendall()',
        'D) socket.accept()'
      ],
      correctAnswerIndex: 1,
      explanation: 'O método "connect_ex" é ideal para scanners, pois em vez de parar o programa com um erro caso a porta esteja fechada, ele apenas retorna um código inteiro (0 significa conexão aberta e sucesso).'
    },
    {
      question: 'Qual biblioteca nativa do Python é recomendada se você precisar rodar comandos do sistema (como ping) e ler seu resultado em texto?',
      options: [
        'A) socket',
        'B) subprocess',
        'C) hashlib',
        'D) math'
      ],
      correctAnswerIndex: 1,
      explanation: 'A biblioteca "subprocess" é a recomendada no Python moderno para rodar executáveis e utilitários do sistema operacional de forma controlada, lendo suas saídas padronizadas.'
    }
  ],
  'cryptography': [
    {
      question: 'Qual é a principal diferença entre um algoritmo de Hashing (como SHA-256) e um de Criptografia (como AES)?',
      options: [
        'A) Hashing é reversível através de chaves públicas, e criptografia é de mão única.',
        'B) Hashing é uma função matemática de via única (irreversível), enquanto a Criptografia é bidirecional (reversível através de chaves).',
        'C) Hashing só funciona no Linux e Criptografia só no Windows.',
        'D) Não há diferença; são apenas nomes diferentes para a mesma técnica.'
      ],
      correctAnswerIndex: 1,
      explanation: 'O Hashing transforma uma entrada em uma assinatura única e irreparável (não é possível "desfazer" um SHA-256 para obter o texto original). A criptografia protege a informação, mas permite decifrá-la com a chave correta.'
    },
    {
      question: 'O que é o "Efeito Avalanche" em criptografia?',
      options: [
        'A) A quebra maciça de servidores de banco de dados por excesso de requisições.',
        'B) O comportamento onde uma alteração mínima na entrada (como uma única letra) produz um hash ou saída completamente diferente e irreconhecível.',
        'C) A perda de chaves de criptografia devido a picos de eletricidade.',
        'D) O travamento do sistema operacional ao processar chaves grandes.'
      ],
      correctAnswerIndex: 1,
      explanation: 'O Efeito Avalanche garante que duas entradas quase idênticas tenham saídas totalmente distintas. Isso impede que atacantes deduzam padrões sobre os dados originais comparando as saídas cifradas.'
    },
    {
      question: 'Como as senhas de usuários devem ser salvas em um banco de dados para garantir máxima proteção contra vazamentos?',
      options: [
        'A) Em texto plano (plaintext) para auditoria rápida.',
        'B) Codificadas com Base64 para ocultação simples.',
        'C) Aplicando funções de hash robustas e adaptativas com salting (como bcrypt ou Argon2).',
        'D) Criptografadas com chaves guardadas em arquivos .txt públicos.'
      ],
      correctAnswerIndex: 2,
      explanation: 'O "salting" insere caracteres aleatórios únicos antes de computar o hash para evitar ataques de tabelas pré-computadas (Rainbow Tables). Algoritmos adaptativos lentos como bcrypt evitam ataques massivos de força bruta.'
    }
  ],
  'owasp-web': [
    {
      question: 'Qual técnica de programação é a mais eficaz para anular completamente riscos de Injeção de SQL (SQLi)?',
      options: [
        'A) Proibir que usuários enviem formulários com caracteres especiais.',
        'B) Usar Prepared Statements (consultas parametrizadas) para que os inputs sejam tratados estritamente como parâmetros, nunca comandos.',
        'C) Criptografar todo o site com certificados SSL/TLS.',
        'D) Recomendar aos clientes que mudem suas senhas diariamente.'
      ],
      correctAnswerIndex: 1,
      explanation: 'Os Prepared Statements separam o esqueleto da instrução SQL dos dados digitados pelo usuário. Quando o banco de dados compila a consulta, o input do usuário é inserido como mero literal, impossibilitando que ele injete sintaxes SQL.'
    },
    {
      question: 'O que é o cabeçalho HTTP "Content-Security-Policy" (CSP)?',
      options: [
        'A) Um documento de termos de uso de dados do site.',
        'B) Um cabeçalho de segurança que define quais origens e tipos de scripts/recursos o navegador está autorizado a carregar e rodar na página, mitigando XSS.',
        'C) Um protocolo que altera a velocidade do site.',
        'D) Um sistema de controle de cookies publicitários.'
      ],
      correctAnswerIndex: 1,
      explanation: 'O CSP atua como um cinto de segurança no navegador do usuário. Se um invasor conseguir injetar um script malicioso no site, o navegador se recusará a executá-lo caso ele viole as regras do CSP.'
    },
    {
      question: 'Se um sistema web aceita comentários e os exibe para todos os visitantes sem filtrar ou escapar tags HTML/JavaScript, ele está exposto a qual falha?',
      options: [
        'A) Injeção de SQL',
        'B) Brute Force',
        'C) Cross-Site Scripting Armazenado (Stored XSS)',
        'D) Broken Authentication'
      ],
      correctAnswerIndex: 2,
      explanation: 'O Stored XSS ocorre quando o payload malicioso (um script) é salvo de forma definitiva no servidor (no banco de dados, por exemplo) e executado no navegador de cada usuário que acessa aquela página futuramente.'
    }
  ],
  'pentest': [
    {
      question: 'O que diferencia a atuação de um profissional de Pentest (Hacker Ético) de um invasor cibercriminoso?',
      options: [
        'A) O Pentester usa ferramentas secretas cedidas pelo governo.',
        'B) O Pentester possui autorização formal por escrito (contrato), segue escopos rígidos e visa reportar as falhas para que sejam corrigidas.',
        'C) O Pentester nunca pode usar Linux nos testes.',
        'D) O Pentester realiza ataques apenas fora do horário comercial.'
      ],
      correctAnswerIndex: 1,
      explanation: 'A ética, a legalidade, a anuência formal do proprietário dos sistemas e o objetivo final de elevar o nível de segurança da empresa são as grandes divisas do hacking ético.'
    },
    {
      question: 'Qual é o papel de um Sistema de Detecção de Intrusão (IDS) em uma infraestrutura corporativa?',
      options: [
        'A) Excluir arquivos suspeitos automaticamente do computador.',
        'B) Analisar logs de rede ou sistemas em tempo real para encontrar assinaturas ou comportamentos típicos de ataques, gerando alertas rápidos.',
        'C) Ocultar servidores expostos na rede mundial.',
        'D) Servir como teclado virtual para senhas críticas.'
      ],
      correctAnswerIndex: 1,
      explanation: 'O IDS atua como um guarda noturno digital. Ele inspeciona logs e tráfego buscando por atividades anômalas ou assinaturas conhecidas (como varreduras e payloads), emitindo alarmes caso note perigo.'
    },
    {
      question: 'Quais são as etapas padronizadas de uma metodologia de Pentest profissional?',
      options: [
        'A) Formatação de PCs -> Instalação de Sistemas -> Relatório.',
        'B) Reconhecimento -> Varredura -> Ganho de Acesso -> Pós-Exploração -> Relatório.',
        'C) Compilação de código -> Criptografia -> Backups.',
        'D) Pentests não possuem etapas; são feitos de forma intuitiva e sem regras.'
      ],
      correctAnswerIndex: 1,
      explanation: 'Pentests profissionais são estruturados: primeiro colhem-se informações (Reconhecimento), descobrem-se portas e vulnerabilidades (Varredura), exploram-se as brechas (Ganho de Acesso), estuda-se o impacto (Pós-Exploração) e documenta-se tudo com soluções recomendadas (Relatório).'
    }
  ]
};

// Core data types
interface Node {
  id: string;
  title: string;
  description: string;
  level: string;
  category: 'fundamentos' | 'programacao' | 'vulnerabilidades' | 'pentest';
  practicalTheory: string;
  recommendedProject: {
    title: string;
    desc: string;
    steps: string[];
    codeTemplate?: string;
  };
  resources: {
    title: string;
    url?: string;
    channel: string;
    type: 'vídeo' | 'vídeo curto' | 'texto' | 'laboratório' | 'curso' | 'projeto' | 'canal' | 'artigo' | 'plataforma';
    level: string;
    language: string;
    cost: string;
    prerequisites: string;
    learningOutcome: string;
  }[];
}

const normalizeStr = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const badgeDefinitions = [
  { id: 'net-basics', name: 'Mestre em Redes', desc: 'Dominou protocolos e sockets', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20 shadow-sky-500/5' },
  { id: 'linux-bash', name: 'Comandante Linux', desc: 'Operou o terminal Bash', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20 shadow-purple-500/5' },
  { id: 'python-sec', name: 'Python Sec Dev', desc: 'Criou robôs e portscanners', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20 shadow-yellow-500/5' },
  { id: 'cryptography', name: 'Guardião Cripto', desc: 'Cifragem e hashing', color: 'text-pink-400 bg-pink-400/10 border-pink-400/20 shadow-pink-500/5' },
  { id: 'owasp-web', name: 'Defensor Web', desc: 'Mitigou injeções e falhas', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-amber-500/5' },
  { id: 'pentest', name: 'Hacker de Elite', desc: 'Auditou sistemas do zero', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-emerald-500/5' }
];

const renderBadgeIcon = (id: string, className: string) => {
  switch (id) {
    case 'net-basics': return <Globe className={className} />;
    case 'linux-bash': return <Terminal className={className} />;
    case 'python-sec': return <Code className={className} />;
    case 'cryptography': return <Lock className={className} />;
    case 'owasp-web': return <Shield className={className} />;
    case 'pentest': return <Sparkles className={className} />;
    default: return <Award className={className} />;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'welcome' | 'mindmap' | 'lab' | 'projects' | 'resources' | 'ai'>('welcome');
  const [selectedNode, setSelectedNode] = useState<string>('net-basics');
  const [resourcesSubTab, setResourcesSubTab] = useState<'free' | 'premium' | 'links'>('free');
  const [mindMapSearch, setMindMapSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [filterCost, setFilterCost] = useState<string>('all');
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [completedNodes, setCompletedNodes] = useState<string[]>(readStoredNodeIds);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [studyDates, setStudyDates] = useState<string[]>(readStoredStudyDates);

  const [longestStreak, setLongestStreak] = useState<number>(readStoredLongestStreak);

  const recordStudyActivity = () => {
    const todayStr = getLocalDateString();
    setStudyDates((prev) => {
      if (prev.includes(todayStr)) return prev;
      return [...prev, todayStr];
    });
  };

  const getLast7Days = () => {
    const days = [];
    const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = getLocalDateString(d);
      const weekday = weekdayNames[d.getDay()];
      const dayOfMonth = d.getDate();
      days.push({
        dateStr,
        weekday,
        dayOfMonth,
        isToday: i === 0
      });
    }
    return days;
  };

  // Keep streak stats in sync
  useEffect(() => {
    const activeStreak = calculateActiveStreak(studyDates);
    if (activeStreak > longestStreak) {
      setLongestStreak(activeStreak);
    }
  }, [studyDates, longestStreak]);

  // Auth listener & Cloud Loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoadingProgress(true);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const cloudCompleted = sanitizeNodeIds(data.completedNodes);
            const cloudStudyDates = sanitizeStudyDates(data.studyDates);
            const cloudLongestStreak = typeof data.longestStreak === 'number' && Number.isFinite(data.longestStreak)
              ? Math.max(0, Math.min(Math.floor(data.longestStreak), 3_660))
              : 0;
            
            // Merge local and cloud progress (union of unique IDs)
            setCompletedNodes((prevLocal) => {
              const merged = Array.from(new Set([...prevLocal, ...cloudCompleted]));
              return merged;
            });

            // Merge local and cloud study dates
            setStudyDates((prevLocal) => {
              const merged = Array.from(new Set([...prevLocal, ...cloudStudyDates]));
              return merged;
            });

            // Merge longest streak
            setLongestStreak((prevLocal) => {
              return Math.max(prevLocal, cloudLongestStreak);
            });

          }
        } catch (error) {
          console.error("Erro ao carregar progresso da nuvem:", error);
          setAuthError("Erro ao sincronizar com o banco de dados.");
        } finally {
          setIsLoadingProgress(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Save to local storage and sync to Firestore
  useEffect(() => {
    localStorage.setItem('sec_completed_nodes', JSON.stringify(completedNodes));
    localStorage.setItem('sec_study_dates', JSON.stringify(studyDates));
    localStorage.setItem('sec_longest_streak', String(longestStreak));
    
    if (user && !isLoadingProgress) {
      const syncCloud = async () => {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, {
            completedNodes: completedNodes,
            studyDates: studyDates,
            longestStreak: longestStreak,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (error) {
          console.error("Erro ao salvar progresso na nuvem:", error);
          setAuthError("Não foi possível salvar o progresso na nuvem. Tente novamente mais tarde.");
        }
      };
      const syncTimer = window.setTimeout(syncCloud, 600);
      return () => window.clearTimeout(syncTimer);
    }
  }, [completedNodes, studyDates, longestStreak, user, isLoadingProgress]);

  // Auth Action handlers
  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === "auth/popup-blocked") {
        setAuthError("O popup de login foi bloqueado pelo seu navegador. Por favor, habilite-o para fazer login.");
      } else {
        setAuthError("Erro de autenticação ou conexão com o Firebase.");
      }
    }
  };

  const handleLogout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout Error:", err);
      setAuthError("Erro ao sair da conta.");
    }
  };

  // Category progress helpers
  const categoryNodes: Record<string, string[]> = {
    fundamentos: ['net-basics', 'linux-bash'],
    programacao: ['python-sec', 'cryptography'],
    vulnerabilidades: ['owasp-web'],
    pentest: ['pentest']
  };

  const getCategoryProgress = (category: string) => {
    const nodes = categoryNodes[category] || [];
    if (nodes.length === 0) return 0;
    const completedCount = nodes.filter(id => completedNodes.includes(id)).length;
    return Math.round((completedCount / nodes.length) * 100);
  };

  const getCategoryCompletedCount = (category: string) => {
    const nodes = categoryNodes[category] || [];
    return nodes.filter(id => completedNodes.includes(id)).length;
  };

  const getCategoryTotalCount = (category: string) => {
    return categoryNodes[category]?.length || 0;
  };
  
  // Vulnerability Simulator States
  const [sqliInput, setSqliInput] = useState<string>("' OR '1'='1");
  const [sqliSecure, setSqliSecure] = useState<boolean>(false);
  const [sqliResult, setSqliResult] = useState<{ status: string; data: any[]; query: string }>({ status: 'idle', data: [], query: '' });
  
  const [xssInput, setXssInput] = useState<string>("<script>alert('Sistema Infiltrado!')</script>");
  const [xssSecure, setXssSecure] = useState<boolean>(false);
  const [xssTriggered, setXssTriggered] = useState<boolean>(false);
  const [xssOutput, setXssOutput] = useState<string>("");

  const [bruteForceActive, setBruteForceActive] = useState<boolean>(false);
  const [bruteForceAttempts, setBruteForceAttempts] = useState<{ pass: string; status: string }[]>([]);
  const [bruteForceSecure, setBruteForceSecure] = useState<boolean>(false);
  const [bruteForceProgress, setBruteForceProgress] = useState<number>(0);
  const [bruteForceStatusText, setBruteForceStatusText] = useState<string>("Inativo");
  const sqliTimerRef = useRef<number | null>(null);
  const bruteForceTimerRef = useRef<number | null>(null);

  // AI Chat States
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string; time: string }[]>([
    { 
      role: 'model', 
      text: 'Olá! Sou seu Mentor de Cibersegurança e Programação Segura. Com qual conceito de segurança ou código de projeto você gostaria de tirar dúvidas hoje? Sinta-se à vontade para perguntar ou clicar nas sugestões abaixo!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userInput, setUserInput] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Quick Quiz States
  const [quizQuestionIdx, setQuizQuestionIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Reset quiz states when the selected mind map node changes
  useEffect(() => {
    setQuizQuestionIdx(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setQuizScore(0);
    setQuizFinished(false);
  }, [selectedNode]);

  useEffect(() => () => {
    if (sqliTimerRef.current !== null) window.clearTimeout(sqliTimerRef.current);
    if (bruteForceTimerRef.current !== null) window.clearInterval(bruteForceTimerRef.current);
  }, []);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Não foi possível copiar o código:', error);
    }
  };

  // Chat request using our backend proxy
  const handleSendMessage = async (textToSend?: string) => {
    if (isAiLoading) return;
    const prompt = (textToSend || userInput).trim().slice(0, 6000);
    if (!prompt) return;

    // Add user message
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { role: 'user', text: prompt, time: timestamp }]);
    setUserInput("");
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt
        })
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setChatMessages(prev => [...prev, { 
          role: 'model', 
          text: data.text || 'Desculpe, não consegui obter uma resposta.', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'model', 
          text: `Erro: ${data.error || 'Erro na comunicação com o assistente.'}`, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
      }
    } catch (error) {
      console.error('Erro ao comunicar com o mentor IA:', error);
      setChatMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Erro de rede ao conectar-se com o assistente do Gemini. Verifique se o servidor está ativo.', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Simulating SQLi
  const handleRunSqli = () => {
    const isSecure = sqliSecure;
    const rawQuery = isSecure 
      ? `SELECT * FROM usuarios WHERE username = ? AND password = ?` 
      : `SELECT * FROM usuarios WHERE username = '${sqliInput}'`;

    if (sqliTimerRef.current !== null) window.clearTimeout(sqliTimerRef.current);

    setSqliResult({
      status: 'loading',
      data: [],
      query: rawQuery
    });

    sqliTimerRef.current = window.setTimeout(() => {
      if (isSecure) {
        // Safe implementation
        setSqliResult({
          status: 'success',
          query: rawQuery,
          data: [] // Nothing found matching the literal input string
        });
      } else {
        // Vulnerable SQLi simulation
        if (sqliInput.includes("' OR '1'='1") || sqliInput.toLowerCase().includes("or 1=1")) {
          setSqliResult({
            status: 'vulnerable_breached',
            query: rawQuery,
            data: [
              { id: 1, usuario: 'admin', hash_senha: '$2b$12$K3Yp7... (Admin root)', cargo: 'Super Administrador' },
              { id: 2, usuario: 'gerente_financeiro', hash_senha: '$2b$12$R9fD8... (Financeiro)', cargo: 'Diretor de Operações' },
              { id: 3, usuario: 'dev_estagiario', hash_senha: '$2b$12$Z2xW4... (Password123)', cargo: 'Desenvolvedor Júnior' }
            ]
          });
        } else {
          setSqliResult({
            status: 'success',
            query: rawQuery,
            data: [] // standard search returned no match
          });
        }
      }
      sqliTimerRef.current = null;
    }, 800);
  };

  // Simulating XSS
  const handleRunXss = () => {
    setXssTriggered(true);
    if (xssSecure) {
      // Escape HTML
      const escaped = xssInput
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
      setXssOutput(escaped);
    } else {
      setXssOutput(xssInput);
    }
  };

  // Simulating Brute Force
  const handleRunBruteForce = () => {
    if (bruteForceActive) return;
    const isSecure = bruteForceSecure;
    setBruteForceActive(true);
    setBruteForceAttempts([]);
    setBruteForceProgress(0);
    setBruteForceStatusText("Iniciando ataque de dicionário...");

    const commonPasswords = [
      "123456", "password", "qwerty", "admin", "love", "gremio", "flamengo", "secret", "security101", "shodan"
    ];
    const correctPassword = "secret";
    
    let currentStep = 0;
    const stopSimulation = () => {
      if (bruteForceTimerRef.current !== null) {
        window.clearInterval(bruteForceTimerRef.current);
        bruteForceTimerRef.current = null;
      }
      setBruteForceActive(false);
    };

    bruteForceTimerRef.current = window.setInterval(() => {
      if (currentStep >= commonPasswords.length) {
        stopSimulation();
        setBruteForceStatusText("Ataque Finalizado. Alvo Acessado!");
        return;
      }

      const tested = commonPasswords[currentStep];
      const isCorrect = tested === correctPassword;

      if (isSecure && currentStep >= 3) {
        // Blocked by Rate Limiting
        setBruteForceAttempts(prev => [
          ...prev, 
          { pass: tested, status: "Bloqueado (Status 429 - Limite de Tentativas)" }
        ]);
        stopSimulation();
        setBruteForceProgress(100);
        setBruteForceStatusText("⚠️ BLOQUEADO! O sistema acionou a defesa de limite de requisições.");
        return;
      }

      setBruteForceAttempts(prev => [
        ...prev, 
        { pass: tested, status: isCorrect ? "SUCESSO (Logado!)" : "Incorreto (Tentando...)" }
      ]);
      setBruteForceProgress(Math.round(((currentStep + 1) / commonPasswords.length) * 100));

      if (isCorrect) {
        stopSimulation();
        setBruteForceStatusText("🔓 SUCESSO! A senha de demonstração foi adivinhada.");
        return;
      }

      currentStep++;
    }, 600);
  };

  // Mind map nodes definition
  const mindMapNodes: Record<string, Node> = {
    'net-basics': {
      id: 'net-basics',
      title: 'Fundamentos de Redes',
      description: 'Entenda como computadores se comunicam, o modelo TCP/IP, portas e protocolos de rede.',
      level: 'Nível 1: Fundamentos',
      category: 'fundamentos',
      practicalTheory: 'Cibersegurança é, antes de tudo, saber como os sistemas conversam entre si. Você precisa dominar o protocolo TCP/IP, entender que portas de rede (como 80 para HTTP, 443 para HTTPS, 22 para SSH) funcionam como "portas" físicas em um condomínio e saber usar utilitários de sistema como ping, traceroute e netstat.',
      recommendedProject: {
        title: 'Criador de Scanner de Conectividade (Ping Utility)',
        desc: 'Desenvolva um script básico que detecta quais IPs na sua rede doméstica estão ativos enviando requisições ICMP básicas.',
        steps: [
          'Aprenda os comandos nativos de terminal (ping).',
          'Use Python com a biblioteca os ou subprocess para rodar ping em lote.',
          'Formate a saída de dados de modo amigável identificando aparelhos vivos.'
        ],
        codeTemplate: `import subprocess
import platform

def verificar_dispositivo(ip):
    # Escolhe o argumento correto com base no sistema operacional
    parametro = "-n" if platform.system().lower() == "windows" else "-c"
    comando = ["ping", parametro, "1", ip]
    
    # Executa o comando em background sem abrir tela
    resultado = subprocess.run(comando, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return resultado.returncode == 0

ip_teste = "8.8.8.8" # DNS do Google
print(f"Testando conexão com {ip_teste}...")
if verificar_dispositivo(ip_teste):
    print("✅ Dispositivo Ativo e Respondendo!")
else:
    print("❌ Dispositivo Inativo ou Bloqueando Ping.")`
      },
      resources: [
        {
          title: 'Como a INTERNET Funciona? (Guia rápido de introdução a REDES)',
          url: 'https://www.youtube.com/watch?v=wkZcszMyUbQ',
          channel: 'Attekita Dev',
          type: 'vídeo curto',
          level: 'iniciante',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Compreender a estrutura de redes de internet e protocolos de comunicação básica.'
        },
        {
          title: 'Introdução a Redes: Como Dados viram Ondas? | Parte 1',
          url: 'https://www.youtube.com/watch?v=0TndL-Nh6Ok',
          channel: 'Fábio Akita',
          type: 'vídeo',
          level: 'básico',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Entender a conversão física de dados em ondas e a história da internet.'
        },
        {
          title: 'MDN Web Docs - Como funciona a Internet',
          url: 'https://developer.mozilla.org/pt-BR/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work',
          channel: 'Mozilla MDN',
          type: 'texto',
          level: 'iniciante',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Entender a estrutura básica e os nós que conectam a internet.'
        },
        {
          title: 'Cisco Packet Tracer (Curso Gratuito)',
          url: 'https://www.netacad.com/courses/introduction-to-cybersecurity',
          channel: 'Cisco Academy',
          type: 'laboratório',
          level: 'básico',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Criar topologias de redes simuladas e testar roteamento.'
        },
        {
          title: 'Curso de Redes de Computadores',
          url: 'https://www.youtube.com/playlist?list=PLHz_AreHm4dkd4lr9G0Up-W-YaHYdTDuP',
          channel: 'Curso em Vídeo',
          type: 'curso',
          level: 'básico',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Domínio conceitual completo do modelo OSI/TCPIP, portas e IPs.'
        }
      ]
    },
    'linux-bash': {
      id: 'linux-bash',
      title: 'Terminal Linux & Bash',
      description: 'Aprenda a operar o terminal Unix, criar scripts de automação e gerenciar permissões.',
      level: 'Nível 1: Fundamentos',
      category: 'fundamentos',
      practicalTheory: 'No mundo da cibersegurança, o mouse é lento demais. Quase todas as ferramentas profissionais (Nmap, Metasploit, Wireshark CLI, Burp Suite) rodam ou se integram melhor no Linux. Dominar a linha de comando e aprender a automatizar rotinas com scripts em Shell/Bash acelerará seu fluxo de trabalho de forma fantástica.',
      recommendedProject: {
        title: 'Script Bash de Backup de Segurança e Auditoria',
        desc: 'Crie um script automatizado simples para compactar arquivos críticos do sistema, extrair logs de alteração e salvar um relatório.',
        steps: [
          'Escreva comandos como tar, grep e find em um arquivo .sh.',
          'Configure variáveis e permissões chmod +x para execução segura.',
          'Gere um arquivo de relatório em texto contendo alertas de arquivos editados recentemente.'
        ],
        codeTemplate: `#!/bin/bash
# script_auditoria.sh - Executa auditoria simples de arquivos modificados nas últimas 24h

DIRETORIO_TESTE="/etc" # Pasta do sistema com configurações
RELATORIO="auditoria_seguranca.txt"

echo "=== INICIANDO AUDITORIA DE SEGURANÇA ===" > "$RELATORIO"
echo "Data: $(date)" >> "$RELATORIO"
echo "Arquivos modificados nas últimas 24 horas:" >> "$RELATORIO"
echo "----------------------------------------" >> "$RELATORIO"

# Encontra arquivos modificados no último 1 dia (apenas listagem ilustrativa para treino)
find "$DIRETORIO_TESTE" -maxdepth 1 -mtime -1 >> "$RELATORIO" 2>/dev/null

echo "Auditoria finalizada! Relatório salvo em: $RELATORIO"`
      },
      resources: [
        {
          title: '30 Comandos do Terminal Linux BÁSICOS que você PRECISA SABER',
          url: 'https://www.youtube.com/watch?v=JEhVB4VHsTI',
          channel: 'Diolinux',
          type: 'vídeo curto',
          level: 'iniciante',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Aprender comandos básicos de navegação e manipulação de arquivos no shell.'
        },
        {
          title: 'Curso de Linux (LPI Linux Essentials)',
          url: 'https://www.youtube.com/playlist?list=PLucm8g_ez1Nq5b-240-O2y8o_0F1HjQfG',
          channel: 'Bóson Treinamentos',
          type: 'curso',
          level: 'básico',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Dominar a arquitetura, permissões, usuários e gerenciamento do Linux.'
        },
        {
          title: 'Guia do Linux (TLDP)',
          url: 'https://tldp.org/LDP/intro-linux/html/',
          channel: 'The Linux Documentation Project',
          type: 'texto',
          level: 'básico',
          language: 'Inglês',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Consultar comandos avançados, flags, redirecionamentos e pipes.'
        },
        {
          title: 'OverTheWire (Bandit Jogo de Terminal)',
          url: 'https://overthewire.org/wargames/bandit/',
          channel: 'OverTheWire',
          type: 'laboratório',
          level: 'iniciante',
          language: 'Inglês',
          cost: 'Gratuito',
          prerequisites: 'Conceitos básicos de terminal',
          learningOutcome: 'Resolver 34 níveis de desafios de linha de comando de forma prática.'
        },
        {
          title: 'Curso de Shell Scripting',
          url: 'https://www.youtube.com/playlist?list=PL711317540D1D23A0',
          channel: 'Bóson Treinamentos',
          type: 'curso',
          level: 'intermediário',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Linux Essentials',
          learningOutcome: 'Escrever scripts complexos de automação e auditoria em bash.'
        }
      ]
    },
    'python-sec': {
      id: 'python-sec',
      title: 'Python para Segurança',
      description: 'Como usar a linguagem mais popular da segurança para criar ferramentas personalizadas.',
      level: 'Nível 2: Programação Prática',
      category: 'programacao',
      practicalTheory: 'Python é o canivete suíço dos hackers éticos. Com poucas linhas de código é possível manipular conexões de sockets, criar utilitários de força bruta, ler arquivos de logs e integrar com APIs de inteligência contra ameaças. Programar em Python permite que você deixe de ser apenas um "script kiddie" (usuário de ferramentas alheias) e se torne um criador.',
      recommendedProject: {
        title: 'Port Scanner Sequencial Seguro',
        desc: 'Desenvolva um scanner rápido de portas de rede para escanear quais serviços estão expostos em um determinado IP.',
        steps: [
          'Utilize a biblioteca socket para estabelecer conexões TCP de teste.',
          'Use estruturas de repetição para varrer as principais portas (21, 22, 80, 443).',
          'Trate exceções e defina limites de tempo (timeout) de resposta rápida.'
        ],
        codeTemplate: `import socket

def port_scan(target_host, ports):
    print(f"🕵️ Iniciando escaneamento rápido em: {target_host}")
    print("-" * 50)
    
    for port in ports:
        # Cria socket TCP IPv4
        client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client.settimeout(0.5) # Tempo limite curto para escanear mais rápido
        
        # connect_ex retorna 0 se a conexão foi bem-sucedida
        result = client.connect_ex((target_host, port))
        
        if result == 0:
            print(f"🔥 Porta [{port}] está ABERTA (Serviço Ativo!)")
        client.close()
    
    print("-" * 50)
    print("Varredura concluída!")

# Testar localmente no IP de loopback (sua máquina)
port_scan("127.0.0.1", [21, 22, 80, 443, 8080, 3000])`
      },
      resources: [
        {
          title: 'Python // Dicionário do Programador',
          url: 'https://www.youtube.com/watch?v=uOgDa1rlqjE',
          channel: 'Código Fonte TV',
          type: 'vídeo curto',
          level: 'iniciante',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Compreender a sintaxe, tipagem e casos de uso do Python.'
        },
        {
          title: 'Aulas Python',
          url: 'https://www.youtube.com/playlist?list=PLfCKf0-awunOu2WyLe2pSD2fXUo795xRe',
          channel: 'Ignorância Zero',
          type: 'curso',
          level: 'básico',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Aprender variáveis, estruturas de dados, loops e funções em Python.'
        },
        {
          title: 'Documentação Oficial do Python (Tutorial)',
          url: 'https://docs.python.org/pt-br/3/tutorial/index.html',
          channel: 'Python Software Foundation',
          type: 'texto',
          level: 'intermediário',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Lógica de programação básica',
          learningOutcome: 'Consultar a referência oficial da sintaxe e bibliotecas padrão.'
        },
        {
          title: 'TryHackMe (Learn Pentest Python)',
          url: 'https://tryhackme.com/module/scripting',
          channel: 'TryHackMe',
          type: 'laboratório',
          level: 'intermediário',
          language: 'Inglês',
          cost: 'Freemium',
          prerequisites: 'Lógica de programação',
          learningOutcome: 'Criar scripts em Python para automatizar escaneamentos de portas e requisições HTTP.'
        },
        {
          title: 'Introdução ao Hacking e Pentest 2.0',
          url: 'https://www.youtube.com/playlist?list=PLp95aw034Wn8Wi0NViVF58hOpX-m00jyg',
          channel: 'Solyd Offensive Security',
          type: 'curso',
          level: 'intermediário',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Python Básico',
          learningOutcome: 'Ver a aplicação prática de Python no desenvolvimento de exploits e ferramentas de segurança.'
        }
      ]
    },
    'cryptography': {
      id: 'cryptography',
      title: 'Criptografia Prática',
      description: 'Entenda Hashing, Criptografia Simétrica, Assimétrica e codificação de dados.',
      level: 'Nível 2: Programação Prática',
      category: 'programacao',
      practicalTheory: 'Criptografia é a espinha dorsal de toda a segurança da informação. Sem ela, seus dados vazariam livremente no Wi-Fi público. Você deve entender a diferença vital entre Hash (função de mão única sem retorno, como SHA-256 ou Bcrypt, usado para salvar senhas) e Criptografia (processo bidirecional que pode ser cifrado e decifrado, como AES ou RSA).',
      recommendedProject: {
        title: 'Comparador de Hashes de Texto (Efeito Avalanche)',
        desc: 'Construa um script que compara hashes SHA-256 de textos e observe como uma pequena alteração muda completamente o resultado.',
        steps: [
          'Utilize a biblioteca hashlib do Python.',
          'Gere o hash de um texto original.',
          'Modifique uma única letra e reanalise para ver o efeito avalanche.'
        ],
        codeTemplate: `import hashlib

def gerar_hash_texto(texto):
    # Converte o texto para bytes e calcula o SHA-256 hash
    sha256 = hashlib.sha256()
    sha256.update(texto.encode('utf-8'))
    return sha256.hexdigest()

texto1 = "Acesso Autorizado ao Sistema Financeiro"
texto2 = "Acesso Autorizado ao Sistema Financeiro." # Apenas um ponto extra

hash1 = gerar_hash_texto(texto1)
hash2 = gerar_hash_texto(texto2)

print(f"Texto 1: {texto1} -> \\nHASH SHA-256: {hash1}\\n")
print(f"Texto 2: {texto2} -> \\nHASH SHA-256: {hash2}\\n")
print(f"Iguais? {'Sim' if hash1 == hash2 else 'Não! (Apenas 1 caractere mudou tudo - Efeito Avalanche)'}")`
      },
      resources: [
        {
          title: 'Criptografia // Dicionário do Programador',
          url: 'https://www.youtube.com/watch?v=qHFbuXpz7e4',
          channel: 'Código Fonte TV',
          type: 'vídeo curto',
          level: 'iniciante',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Entender o conceito de cifragem, chaves simétricas e assimétricas.'
        },
        {
          title: 'Entendendo Conceitos Básicos de CRIPTOGRAFIA | Parte 1/2',
          url: 'https://www.youtube.com/watch?v=CcU5Kc_FN_4',
          channel: 'Fábio Akita',
          type: 'vídeo',
          level: 'básico',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Compreender chaves, cifras, hashes e integridade matemática.'
        },
        {
          title: 'Criptografia - Conceitos de Segurança (OWASP Cheat Sheet)',
          url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html',
          channel: 'OWASP Foundation',
          type: 'texto',
          level: 'intermediário',
          language: 'Inglês',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Conhecer as diretrizes de armazenamento seguro e uso de algoritmos criptográficos.'
        },
        {
          title: 'Cryptography Basics Lab',
          url: 'https://tryhackme.com/room/cryptographyfordummy',
          channel: 'TryHackMe',
          type: 'laboratório',
          level: 'iniciante',
          language: 'Inglês',
          cost: 'Freemium',
          prerequisites: 'Nenhum',
          learningOutcome: 'Decifrar mensagens criptografadas usando cifras clássicas de forma interativa.'
        },
        {
          title: 'Curso de Segurança e Criptografia',
          url: 'https://www.youtube.com/playlist?list=PLucm8g_ezqNqK-B91r-w1uJ7N_Z7-XvS7',
          channel: 'Bóson Treinamentos',
          type: 'curso',
          level: 'intermediário',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Estudar assinaturas digitais, cifras de bloco e protocolos de autenticação.'
        }
      ]
    },
    'owasp-web': {
      id: 'owasp-web',
      title: 'OWASP Top 10 & Web Sec',
      description: 'Descubra os 10 maiores vetores de falhas em aplicações web do mundo e como evitá-los.',
      level: 'Nível 3: Segurança Web',
      category: 'vulnerabilidades',
      practicalTheory: 'O OWASP (Open Worldwide Application Security Project) é uma comunidade aberta que lista constantemente os riscos de segurança de aplicações web mais graves. Entre eles destacam-se: Injeções (SQLi, Command Injection), Autenticação Quebrada, Exposição de Dados Sensíveis e Cross-Site Scripting (XSS). Entender essa lista é mandatório para qualquer programador web ou analista de segurança.',
      recommendedProject: {
        title: 'Analisador de Cabeçalhos HTTP de Segurança',
        desc: 'Crie uma ferramenta em Python que inspeciona qualquer site web e avisa se ele possui cabeçalhos de proteção como X-Frame-Options ou Content-Security-Policy.',
        steps: [
          'Utilize a biblioteca requests do Python para requisitar páginas da web.',
          'Estude cabeçalhos como Content-Security-Policy (CSP) e Strict-Transport-Security.',
          'Avalie a nota de segurança do site inspecionado com base nas respostas obtidas.'
        ],
        codeTemplate: `import requests

def analisar_seguranca_http(url):
    try:
        if not url.startswith('http'):
            url = 'https://' + url
            
        print(f"🕵️ Inspecionando cabeçalhos HTTP de: {url}")
        resposta = requests.get(url, timeout=3)
        cabecalhos = resposta.headers
        
        recomendações = {
            'Content-Security-Policy': 'Previne ataques de injeção como XSS.',
            'Strict-Transport-Security': 'Força o uso de HTTPS seguro.',
            'X-Frame-Options': 'Previne ataques do tipo Clickjacking (frames clonados).',
            'X-Content-Type-Options': 'Previne que navegadores interpretem tipos MIME incorretos.'
        }
        
        print("-" * 50)
        pontuacao = 100
        for header, desc in recomendações.items():
            if header in cabecalhos:
                print(f"✅ Encontrado: {header}")
            else:
                print(f"❌ Ausente: {header} | Risco: {desc}")
                pontuacao -= 25
                
        print("-" * 50)
        print(f"Pontuação de Segurança de Cabeçalho: {max(0, pontuacao)}/100")
    except Exception as e:
        print(f"Erro ao conectar com o site: {e}")

# Exemplo de teste simples (use um domínio conhecido para testar no seu console real)
analisar_seguranca_http("google.com")`
      },
      resources: [
        {
          title: 'TOP 10 Ameaças de Segurança em Aplicações Web - DICAS DE PREVENÇÃO!',
          url: 'https://www.youtube.com/watch?v=OzBy8nYLY-I',
          channel: 'Código Fonte TV',
          type: 'vídeo curto',
          level: 'iniciante',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Conceituar os 10 maiores riscos de segurança web.'
        },
        {
          title: 'Web Security Academy — Primeiros passos',
          url: 'https://portswigger.net/web-security/getting-started',
          channel: 'PortSwigger',
          type: 'laboratório',
          level: 'básico',
          language: 'Inglês',
          cost: 'Gratuito',
          prerequisites: 'Redes e HTTP',
          learningOutcome: 'Seguir uma trilha guiada com leitura e laboratórios controlados de segurança web.'
        },
        {
          title: 'OWASP Top 10 Official Document',
          url: 'https://owasp.org/www-project-top-ten/',
          channel: 'OWASP Foundation',
          type: 'texto',
          level: 'básico',
          language: 'Inglês',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Consultar a documentação de referência mundial das falhas de aplicações.'
        },
        {
          title: 'OWASP Top 10 Room',
          url: 'https://tryhackme.com/room/owasptop10',
          channel: 'TryHackMe',
          type: 'laboratório',
          level: 'básico',
          language: 'Inglês',
          cost: 'Freemium',
          prerequisites: 'Conceitos de redes e HTTP',
          learningOutcome: 'Explorar falhas web simuladas e entender como corrigi-las de forma segura.'
        },
        {
          title: 'Prevenção de SQL Injection (OWASP Cheat Sheet)',
          url: 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
          channel: 'OWASP Foundation',
          type: 'texto',
          level: 'intermediário',
          language: 'Inglês',
          cost: 'Gratuito',
          prerequisites: 'Conceitos de banco de dados',
          learningOutcome: 'Aplicar consultas parametrizadas, validação por allowlist e outras defesas contra SQL Injection.'
        }
      ]
    },
    'pentest': {
      id: 'pentest',
      title: 'Metodologias de Pentest',
      description: 'Aprenda as fases de um teste de invasão ético: Reconhecimento, Varredura, Ganho e Manutenção de Acesso.',
      level: 'Nível 4: Pentest & Defesa',
      category: 'pentest',
      practicalTheory: 'Um Pentest (Teste de Invasão) é uma auditoria simulada de invasão real autorizada para detectar brechas antes que cibercriminosos o façam. Ele segue passos rígidos: Reconhecimento (Information Gathering / OSINT), Escaneamento (usando ferramentas de mapeamento de portas), Exploração (ganho de controle sobre a vulnerabilidade) e Pós-exploração / Relatório (etapa vital que resume os riscos para a diretoria).',
      recommendedProject: {
        title: 'Analisador de Logs e Detecção de Intrusão (IDS Base)',
        desc: 'Programe um analisador automático de logs Apache/Nginx que encontra endereços IP fazendo varreduras violentas ou tentando injeções.',
        steps: [
          'Escreva um programa Python que lê um arquivo txt contendo registros de requisições de servidores.',
          'Procure por assinaturas de ataques como aspas simples, tags HTML <script> ou erros de autenticação repetitivos.',
          'Gere alertas imediatos com o IP que mais tentou realizar requisições maliciosas.'
        ],
        codeTemplate: `import re

# Simulação de registros de log de servidor web com possíveis ameaças
dados_log = [
    '192.168.0.10 - - [12/Jul/2026:12:01] "GET /index.html HTTP/1.1" 200',
    '192.168.0.45 - - [12/Jul/2026:12:02] "GET /login?user=admin\\' OR \\'1\\'=\\'1 HTTP/1.1" 500', # Ataque SQLi
    '192.168.0.10 - - [12/Jul/2026:12:02] "GET /about.html HTTP/1.1" 200',
    '192.168.0.45 - - [12/Jul/2026:12:03] "POST /comentarios?texto=<script>alert(1)</script> HTTP/1.1" 403', # Ataque XSS
    '10.0.0.12 - - [12/Jul/2026:12:04] "GET /wp-admin/login.php HTTP/1.1" 404', # Scan de admin
]

def analisar_ameacas(logs):
    print("🕵️ Iniciando Varredura do Sistema de Detecção de Intrusão (IDS)...")
    print("=" * 60)
    
    contador_alertas = 0
    for linha in logs:
        # Detectar assinaturas comuns
        sqli_detectado = re.search(r"('|or|OR|1=1|1\\s*=\\s*1)", linha)
        xss_detectado = re.search(r"(<script>|script|alert)", linha)
        
        if sqli_detectado:
            print(f"🚨 [ALERTA SQLi] Tentativa de Injeção de SQL identificada!")
            print(f"   Origem: {linha.split()[0]} | Requisição: {linha}")
            contador_alertas += 1
        elif xss_detectado:
            print(f"🚨 [ALERTA XSS] Tentativa de Script malicioso (XSS) identificada!")
            print(f"   Origem: {linha.split()[0]} | Requisição: {linha}")
            contador_alertas += 1
            
    print("=" * 60)
    print(f"Análise finalizada. Alertas críticos gerados: {contador_alertas}")

analisar_ameacas(dados_log)`
      },
      resources: [
        {
          title: 'Pentest Profissional: Introdução',
          url: 'https://www.youtube.com/watch?v=oPGMahvwaKE',
          channel: 'Messias Eric',
          type: 'vídeo curto',
          level: 'iniciante',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Compreender o conceito e as etapas de um teste de invasão ético.'
        },
        {
          title: 'Introdução ao Hacking e Pentest 2.0',
          url: 'https://www.youtube.com/playlist?list=PLp95aw034Wn8Wi0NViVF58hOpX-m00jyg',
          channel: 'Solyd Offensive Security',
          type: 'curso',
          level: 'básico',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Redes e Linux',
          learningOutcome: 'Aprender as fases de pentest de forma estruturada e em ambientes simulados.'
        },
        {
          title: 'OWASP Web Security Testing Guide',
          url: 'https://owasp.org/www-project-web-security-testing-guide/',
          channel: 'OWASP Foundation',
          type: 'texto',
          level: 'intermediário',
          language: 'Inglês',
          cost: 'Gratuito',
          prerequisites: 'Nenhum',
          learningOutcome: 'Planejar, executar e reportar testes de segurança web com uma metodologia pública e atualizada.'
        },
        {
          title: 'HackTheBox (Laboratórios práticos de invasão)',
          url: 'https://www.hackthebox.com/',
          channel: 'HackTheBox',
          type: 'laboratório',
          level: 'intermediário',
          language: 'Inglês',
          cost: 'Freemium',
          prerequisites: 'Conceitos básicos de hacking',
          learningOutcome: 'Resolver laboratórios práticos e invadir máquinas virtuais vulneráveis de forma legal.'
        },
        {
          title: 'Como instalar o nmap e zenmap no Debian Linux e derivados',
          url: 'https://www.youtube.com/watch?v=cEAPTtn8TyU',
          channel: 'Bóson Treinamentos',
          type: 'vídeo',
          level: 'básico',
          language: 'Português',
          cost: 'Gratuito',
          prerequisites: 'Linux básico',
          learningOutcome: 'Aprender a instalar, configurar e rodar escaneamentos de portas e serviços usando o Nmap.'
        }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#d4d4d8] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Header Bar */}
      <header className="min-h-[5rem] py-4 lg:py-0 lg:h-20 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur sticky top-0 z-40 px-8 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-9 h-9 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif italic text-xl tracking-wide text-white">SecAcademy</span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded">INITIATE_USER</span>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Jornada de Cibersegurança & Lab Prático</p>
          </div>
        </div>

        {/* Navigation & Auth Section */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Global Navigation Tabs */}
          <nav aria-label="Navegação principal" className="flex items-center flex-wrap justify-center gap-1.5 p-1 bg-[#050505] rounded-lg border border-white/5 w-full md:w-auto">
            <button 
              id="tab-welcome"
              onClick={() => setActiveTab('welcome')}
              className={`px-3 py-1.5 rounded text-xs uppercase tracking-widest font-mono font-medium transition-all flex items-center gap-1.5 ${activeTab === 'welcome' ? 'text-emerald-400 border-b-2 border-emerald-500 rounded-none bg-transparent' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <Shield className="w-4 h-4" />
              Início
            </button>
            <button 
              id="tab-mindmap"
              onClick={() => setActiveTab('mindmap')}
              className={`px-3 py-1.5 rounded text-xs uppercase tracking-widest font-mono font-medium transition-all flex items-center gap-1.5 ${activeTab === 'mindmap' ? 'text-emerald-400 border-b-2 border-emerald-500 rounded-none bg-transparent' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <BookOpen className="w-4 h-4" />
              Mapa Mental
            </button>
            <button 
              id="tab-lab"
              onClick={() => setActiveTab('lab')}
              className={`px-3 py-1.5 rounded text-xs uppercase tracking-widest font-mono font-medium transition-all flex items-center gap-1.5 ${activeTab === 'lab' ? 'text-emerald-400 border-b-2 border-emerald-500 rounded-none bg-transparent' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <Terminal className="w-4 h-4" />
              Laboratório Interativo
            </button>
            <button 
              id="tab-projects"
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 rounded text-xs uppercase tracking-widest font-mono font-medium transition-all flex items-center gap-1.5 ${activeTab === 'projects' ? 'text-emerald-400 border-b-2 border-emerald-500 rounded-none bg-transparent' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <Code className="w-4 h-4" />
              Códigos & Projetos
            </button>
            <button 
              id="tab-resources"
              onClick={() => setActiveTab('resources')}
              className={`px-3 py-1.5 rounded text-xs uppercase tracking-widest font-mono font-medium transition-all flex items-center gap-1.5 ${activeTab === 'resources' ? 'text-emerald-400 border-b-2 border-emerald-500 rounded-none bg-transparent' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <Tv className="w-4 h-4" />
              Vídeos & Estudos
            </button>
            <button 
              id="tab-ai"
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1.5 rounded text-xs uppercase tracking-widest font-mono font-medium transition-all flex items-center gap-1.5 ${activeTab === 'ai' ? 'text-emerald-400 border-b-2 border-emerald-500 rounded-none bg-transparent' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <MessageSquare className="w-4 h-4" />
              Mentor IA
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          </nav>

          {/* Auth Button / Profile Section */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user ? (
              <div className="flex items-center gap-3 bg-[#050505] border border-white/10 pl-2 pr-3 py-1.5 rounded-lg select-none">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "Usuário"} 
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full border border-emerald-500/20"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[10px] font-mono text-emerald-400 font-bold">
                    {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : "US"}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-medium text-white max-w-[120px] truncate leading-tight">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[8px] font-mono text-emerald-400 flex items-center gap-0.5 mt-0.5" title="Seu progresso está salvo de forma segura no Firebase Cloud Firestore">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Nuvem Ativa
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="ml-1.5 text-zinc-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-white/5 cursor-pointer"
                  title="Sair da Conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {authError && (
                  <span className="text-[10px] font-mono text-red-400 bg-red-500/5 px-2.5 py-1 rounded border border-red-500/10 max-w-[150px] truncate" title={authError}>
                    {authError}
                  </span>
                )}
                <button 
                  onClick={handleGoogleLogin}
                  className="px-3.5 py-1.5 rounded text-[11px] font-mono uppercase tracking-wider font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/5 hover:scale-[1.02]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Salvar Progresso
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">

        {/* WELCOME TAB */}
        {activeTab === 'welcome' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Banner Hero */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-r from-[#0a0a0a] via-[#050505] to-[#0a0a0a] p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_50%)]"></div>
              
              <div className="space-y-4 max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono tracking-widest uppercase text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Boas-vindas à sua trilha prática
                </div>
                <h2 className="text-3xl md:text-5xl font-serif text-white tracking-wide leading-tight">
                  Quer dominar a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 italic">Cibersegurança</span> através da Programação Real?
                </h2>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-sans">
                  Para se destacar em cibersegurança, não basta usar softwares prontos. Você precisa entender o código por trás dos sistemas, como explorá-los de forma ética e, mais importante, <strong className="text-white">como blindá-los</strong> contra intrusões.
                </p>
                
                <div className="flex flex-wrap gap-4 pt-2">
                  <button 
                    onClick={() => setActiveTab('mindmap')}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2"
                  >
                    Ver o Mapa Mental <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setActiveTab('lab')}
                    className="px-5 py-2.5 bg-[#0a0a0a] hover:bg-zinc-900 border border-white/10 text-white rounded font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2"
                  >
                    Simular Hacks <Terminal className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-3xl animate-pulse opacity-30"></div>
                <div className="relative p-6 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-xs">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">HACKER ÉTICO INCIPIT</span>
                    <h3 className="text-sm font-serif italic text-white">Prática vs. Teoria</h3>
                    <p className="text-xs text-zinc-500">Este portal fornece código real comentado e cenários interativos de exploração.</p>
                  </div>
                  <div className="w-full bg-[#050505] p-2 rounded border border-white/5 font-mono text-left text-[10px] text-emerald-400/90 space-y-1">
                    <div>$ python3 hacker_tool.py</div>
                    <div className="text-zinc-600">[+] Scanning target...</div>
                    <div className="text-zinc-600">[+] Port 80 Open!</div>
                    <div className="text-red-400/90">[!] OWASP Vulnerability Found</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Dashboard */}
            <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-white">
                      Dashboard de Progresso da Jornada / Progress Dashboard
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    Acompanhe seu avanço em cada etapa da trilha de cibersegurança. Complete os quizzes no Mapa Mental para progredir!
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-[#050505] border border-white/5 px-4 py-2 rounded-xl shrink-0">
                  <div className="space-y-0.5">
                    <span className="block text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Conclusão Geral</span>
                    <span className="block font-serif italic text-white text-lg leading-none">
                      {Math.round((completedNodes.length / LEARNING_NODE_IDS.length) * 100)}% <span className="text-xs text-zinc-500 font-sans font-normal">({completedNodes.length}/{LEARNING_NODE_IDS.length} Módulos)</span>
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-white/5 relative flex items-center justify-center bg-emerald-500/5">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-white/5"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-400 transition-all duration-500"
                        strokeWidth="3"
                        strokeDasharray={`${Math.round((completedNodes.length / LEARNING_NODE_IDS.length) * 100)}, 100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Login CTA Card */}
              {!user ? (
                <div className="p-5 rounded-xl border border-dashed border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
                  <div className="space-y-1 text-left">
                    <h4 className="text-sm font-serif italic text-white flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Sincronizar Progresso na Nuvem
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                      Seu progresso atual fica neste navegador. Ao conectar sua conta Google, o site armazena apenas o progresso de estudo (módulos, datas e sequência) no Firebase; o conteúdo das respostas do quiz não é enviado.
                    </p>
                  </div>
                  <button 
                    onClick={handleGoogleLogin}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded font-mono text-[11px] uppercase tracking-wider font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                  >
                    <LogIn className="w-4 h-4" />
                    Conectar Google
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
                  <div className="space-y-1 text-left">
                    <h4 className="text-sm font-serif italic text-emerald-400 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4" />
                      Conta Conectada e Progresso Salvo!
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                      Seu progresso está sendo sincronizado automaticamente em tempo real com o Firestore para o e-mail <strong className="text-white">{user.email}</strong>.
                    </p>
                  </div>
                  <div className="px-3 py-1.5 bg-[#050505] border border-white/5 rounded text-[10px] font-mono text-zinc-500 select-none">
                    Status: <span className="text-emerald-400 font-bold">Nuvem Conectada</span>
                  </div>
                </div>
              )}

              {/* Sequência de Estudos (Streak) Tracker Card */}
              <div className="p-5 rounded-xl border border-white/10 bg-[#050505] flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-4 w-full md:w-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Flame className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Sequência de Estudos / Daily Streak</span>
                      <span className="block font-serif italic text-white text-xl leading-none font-bold flex items-center gap-1.5">
                        {calculateActiveStreak(studyDates)} {calculateActiveStreak(studyDates) === 1 ? 'Dia' : 'Dias'} Seguidos
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-zinc-400">
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400">🏆</span>
                      <span className="text-zinc-500">Recorde Histórico:</span>
                      <strong className="text-white font-medium">{longestStreak} {longestStreak === 1 ? 'dia' : 'dias'}</strong>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400">📅</span>
                      <span className="text-zinc-500">Dias Totais de Estudo:</span>
                      <strong className="text-white font-medium">{studyDates.length}</strong>
                    </div>
                  </div>

                  {/* Manual Study Button or Logged Banner */}
                  <div>
                    {studyDates.includes(getLocalDateString()) ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono">
                        <Check className="w-3.5 h-3.5" /> Estudo de Hoje Registrado! Continue assim!
                      </div>
                    ) : (
                      <button
                        onClick={recordStudyActivity}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-lg font-mono text-[10px] uppercase tracking-widest font-bold transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        Registrar Estudo de Hoje
                      </button>
                    )}
                  </div>
                </div>

                {/* 7-Day Calendar Grid */}
                <div className="w-full md:w-auto bg-[#0a0a0a]/60 border border-white/5 p-4 rounded-xl space-y-2 shrink-0">
                  <span className="block text-[9px] font-mono uppercase text-zinc-500 tracking-widest text-center md:text-left">
                    Atividade dos últimos 7 dias
                  </span>
                  <div className="grid grid-cols-7 gap-2 max-w-sm mx-auto">
                    {getLast7Days().map((day) => {
                      const hasStudied = studyDates.includes(day.dateStr);
                      return (
                        <div key={day.dateStr} className="flex flex-col items-center gap-1">
                          <span className="text-[9px] font-mono text-zinc-500">{day.weekday}</span>
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center border text-[11px] font-mono transition-all duration-300 ${
                              hasStudied 
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold shadow-sm shadow-amber-500/10' 
                                : day.isToday
                                  ? 'bg-[#050505] border-emerald-500/30 text-emerald-400 border-dashed animate-pulse'
                                  : 'bg-[#050505] border-white/5 text-zinc-600'
                            }`}
                            title={hasStudied ? `Estudou em ${day.dateStr}` : `Sem atividade em ${day.dateStr}`}
                          >
                            {hasStudied ? "🔥" : day.dayOfMonth}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Fundamentals */}
                <div className="p-4 bg-[#050505] rounded-xl border border-white/5 space-y-3 hover:border-white/10 transition-all flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span className="uppercase text-[9px] tracking-widest text-emerald-400 font-bold">Fundamentals</span>
                      <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">{getCategoryCompletedCount('fundamentos')}/{getCategoryTotalCount('fundamentos')}</span>
                    </div>
                    <h4 className="text-sm font-serif italic text-white font-medium">Fundamentals</h4>
                    <p className="text-[11px] text-zinc-500 leading-normal">Conceitos Básicos de Redes &amp; Comandos Linux / Bash.</p>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{ width: `${getCategoryProgress('fundamentos')}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                      <span>Progresso</span>
                      <span className="text-emerald-400 font-bold">{getCategoryProgress('fundamentos')}%</span>
                    </div>
                  </div>
                </div>

                {/* Programming */}
                <div className="p-4 bg-[#050505] rounded-xl border border-white/5 space-y-3 hover:border-white/10 transition-all flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span className="uppercase text-[9px] tracking-widest text-emerald-400 font-bold">Programming</span>
                      <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">{getCategoryCompletedCount('programacao')}/{getCategoryTotalCount('programacao')}</span>
                    </div>
                    <h4 className="text-sm font-serif italic text-white font-medium">Programming</h4>
                    <p className="text-[11px] text-zinc-500 leading-normal">Python para Segurança &amp; Criptografia Prática.</p>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{ width: `${getCategoryProgress('programacao')}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                      <span>Progresso</span>
                      <span className="text-emerald-400 font-bold">{getCategoryProgress('programacao')}%</span>
                    </div>
                  </div>
                </div>

                {/* Web Security */}
                <div className="p-4 bg-[#050505] rounded-xl border border-white/5 space-y-3 hover:border-white/10 transition-all flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span className="uppercase text-[9px] tracking-widest text-emerald-400 font-bold">Web Security</span>
                      <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">{getCategoryCompletedCount('vulnerabilidades')}/{getCategoryTotalCount('vulnerabilidades')}</span>
                    </div>
                    <h4 className="text-sm font-serif italic text-white font-medium">Web Security</h4>
                    <p className="text-[11px] text-zinc-500 leading-normal">Ataques da OWASP, proteção de código web e injeções.</p>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{ width: `${getCategoryProgress('vulnerabilidades')}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                      <span>Progresso</span>
                      <span className="text-emerald-400 font-bold">{getCategoryProgress('vulnerabilidades')}%</span>
                    </div>
                  </div>
                </div>

                {/* Pentest */}
                <div className="p-4 bg-[#050505] rounded-xl border border-white/5 space-y-3 hover:border-white/10 transition-all flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span className="uppercase text-[9px] tracking-widest text-emerald-400 font-bold">Pentest</span>
                      <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">{getCategoryCompletedCount('pentest')}/{getCategoryTotalCount('pentest')}</span>
                    </div>
                    <h4 className="text-sm font-serif italic text-white font-medium">Pentest</h4>
                    <p className="text-[11px] text-zinc-500 leading-normal">Fases de Pentest, auditoria prática e logs de ataques.</p>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{ width: `${getCategoryProgress('pentest')}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                      <span>Progresso</span>
                      <span className="text-emerald-400 font-bold">{getCategoryProgress('pentest')}%</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Dynamic Quick Actions */}
              {completedNodes.length < LEARNING_NODE_IDS.length ? (
                <div className="p-4 bg-[#050505] rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-zinc-300">
                      Você completou <strong className="text-emerald-400">{completedNodes.length} de {LEARNING_NODE_IDS.length}</strong> módulos. Continue sua formação prática!
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      const allNodes = ['net-basics', 'linux-bash', 'python-sec', 'cryptography', 'owasp-web', 'pentest'];
                      const firstUncompleted = allNodes.find(id => !completedNodes.includes(id)) || 'net-basics';
                      setSelectedNode(firstUncompleted);
                      setActiveTab('mindmap');
                    }}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded font-mono text-[10px] uppercase tracking-widest font-bold transition-all shrink-0 self-start sm:self-center"
                  >
                    Estudar Próximo Nível
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center text-xs space-y-1">
                  <p className="text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                    <Award className="w-5 h-5" /> Parabéns! Você concluiu 100% da trilha SecAcademy!
                  </p>
                  <p className="text-zinc-400 leading-relaxed max-w-xl mx-auto">
                    Você dominou Redes, Linux terminal, programação segura em Python, cabeçalhos de segurança, e etapas de Pentest. Continue praticando nos simuladores de laboratório!
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stats Bento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1 */}
              <div className="p-6 rounded-xl border border-white/5 bg-[#0a0a0a] hover:bg-zinc-900/40 transition-all flex flex-col gap-4">
                <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <BookMarked className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif italic text-white text-lg">Mapa de Estudos Completo</h3>
                  <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Navegue por tópicos cruciais, de redes e terminal Linux até desenvolvimento de scripts em Python e metodologia de Pentest.</p>
                </div>
                <button onClick={() => setActiveTab('mindmap')} className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 mt-auto group">
                  Explorar Mapa <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
 
              {/* Card 2 */}
              <div className="p-6 rounded-xl border border-white/5 bg-[#0a0a0a] hover:bg-zinc-900/40 transition-all flex flex-col gap-4">
                <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif italic text-white text-lg">Simulador de Código & Exploits</h3>
                  <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Interaja com laboratórios virtuais de SQL Injection, Cross-Site Scripting (XSS) e ataques de força bruta. Alterne a proteção e veja como blindar o código.</p>
                </div>
                <button onClick={() => setActiveTab('lab')} className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 mt-auto group">
                  Iniciar Laboratório <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
 
              {/* Card 3 */}
              <div className="p-6 rounded-xl border border-white/5 bg-[#0a0a0a] hover:bg-zinc-900/40 transition-all flex flex-col gap-4">
                <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif italic text-white text-lg">Mentor de Estudos IA (Gemini)</h3>
                  <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Ficou com dúvida sobre algum script, comando de rede ou quer ideias para seu primeiro projeto? Nosso assistente treinado para Cibersegurança está pronto.</p>
                </div>
                <button onClick={() => setActiveTab('ai')} className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 mt-auto group">
                  Perguntar ao Mentor <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
 
            </div>
 
            {/* Beginner Quick Guide */}
            <div className="p-6 rounded-xl border border-white/5 bg-[#0a0a0a]/50 space-y-4">
              <h3 className="font-serif italic text-white text-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Seus Primeiros Passos Recomendados na Cibersegurança:
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-[#050505] border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded font-bold uppercase">Passo 1</span>
                  <h4 className="text-sm font-bold text-white">Dominar o Terminal</h4>
                  <p className="text-xs text-zinc-500 leading-normal">Aprenda a navegar por pastas, gerenciar processos e manipular texto puro no Linux Bash.</p>
                </div>
                
                <div className="p-4 rounded-lg bg-[#050505] border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded font-bold uppercase">Passo 2</span>
                  <h4 className="text-sm font-bold text-white">Lógica de Redes</h4>
                  <p className="text-xs text-zinc-500 leading-normal">Entenda portas, roteamento de pacotes e o funcionamento de um servidor HTTP de verdade.</p>
                </div>
 
                <div className="p-4 rounded-lg bg-[#050505] border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded font-bold uppercase">Passo 3</span>
                  <h4 className="text-sm font-bold text-white">Automação com Python</h4>
                  <p className="text-xs text-zinc-500 leading-normal">Escreva pequenos robôs de testes de porta de rede, requisições HTTP e manipuladores de hash de arquivos.</p>
                </div>
 
                <div className="p-4 rounded-lg bg-[#050505] border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded font-bold uppercase">Passo 4</span>
                  <h4 className="text-sm font-bold text-white">Praticar Lab Ético</h4>
                  <p className="text-xs text-zinc-500 leading-normal">Acesse simuladores, jogue Wargames gratuitos (como Bandit OverTheWire) e estude as falhas do OWASP.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MIND MAP TAB */}
        {activeTab === 'mindmap' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Mind Map Interactive Navigator (Left side - Col 5) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="p-4 bg-[#0a0a0a] rounded-lg border border-white/10 space-y-3">
                <h3 className="font-serif italic text-white text-base">Selecione uma Trilha do Mapa</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Clique nas ramificações para ler o conteúdo conceitual e ver o código recomendado para desenvolvimento prático.</p>
                
                {/* Search Bar */}
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={mindMapSearch}
                    onChange={(e) => setMindMapSearch(e.target.value)}
                    aria-label="Filtrar trilhas do mapa mental"
                    placeholder="Filtrar por título, categoria (ex: programação)..."
                    className="w-full bg-[#050505] border border-white/10 rounded px-3 py-2 pl-9 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                  />
                  {mindMapSearch && (
                    <button
                      onClick={() => setMindMapSearch('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-white font-mono text-[10px]"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Graphical Nodes list */}
              <div className="flex flex-col gap-4 relative">
                
                {/* Connector line effect */}
                <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-white/5 z-0"></div>

                {(() => {
                  const allNodeIds = LEARNING_NODE_IDS;
                  const filteredNodeIds = allNodeIds.filter(id => {
                    const node = mindMapNodes[id];
                    if (!node) return false;
                    if (!mindMapSearch.trim()) return true;
                    
                    const query = normalizeStr(mindMapSearch);
                    const titleMatch = normalizeStr(node.title).includes(query);
                    const categoryMatch = normalizeStr(node.category).includes(query);
                    const levelMatch = normalizeStr(node.level).includes(query);
                    const descMatch = normalizeStr(node.description).includes(query);
                    
                    let categoryAlias = '';
                    if (node.category === 'fundamentos') categoryAlias = 'redes fundamentos linux bash';
                    if (node.category === 'programacao') categoryAlias = 'programacao python desenvolvimento codigo scripting criptografia';
                    if (node.category === 'vulnerabilidades') categoryAlias = 'web security vulnerabilidades owasp xss sqli invasao';
                    if (node.category === 'pentest') categoryAlias = 'pentest auditoria invasao hacker etico';
                    
                    const aliasMatch = normalizeStr(categoryAlias).includes(query);
                    
                    return titleMatch || categoryMatch || levelMatch || descMatch || aliasMatch;
                  });

                  if (filteredNodeIds.length === 0) {
                    return (
                      <div className="p-8 text-center border border-dashed border-white/10 rounded-xl bg-[#0a0a0a] relative z-10 w-full">
                        <p className="text-xs text-zinc-500">Nenhum nó encontrado para "{mindMapSearch}".</p>
                        <button 
                          onClick={() => setMindMapSearch('')}
                          className="text-[10px] text-emerald-400 font-mono mt-2 hover:underline cursor-pointer"
                        >
                          Limpar Filtro
                        </button>
                      </div>
                    );
                  }

                  return filteredNodeIds.map(id => {
                    const node = mindMapNodes[id];
                    const index = allNodeIds.indexOf(id);
                    const num = String(index + 1).padStart(2, '0');
                    const isSelected = selectedNode === id;
                    const isEarned = completedNodes.includes(id);

                    return (
                      <button 
                        key={id}
                        onClick={() => setSelectedNode(id)}
                        className={`relative z-10 flex items-start gap-4 p-4 rounded-xl border transition-all text-left w-full ${isSelected ? 'bg-[#0a0a0a] border-emerald-500/50 shadow-lg shadow-emerald-500/5' : 'bg-[#0a0a0a] border-white/5 hover:border-white/10 hover:bg-white/5'}`}
                      >
                        <div className={`w-12 h-12 rounded flex items-center justify-center border font-mono text-base shrink-0 ${isSelected ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-[#050505] border-white/5 text-zinc-500'}`}>
                          {num}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">{node.level}</span>
                            {isEarned && (
                              <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-semibold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Medalha Ganha
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif italic text-white text-base mt-0.5 truncate">{node.title}</h4>
                          <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{node.description}</p>
                        </div>
                      </button>
                    );
                  });
                })()}

              </div>

              {/* Badges / Medalhas Panel */}
              <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif italic text-white text-base flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    Suas Medalhas de Conclusão
                  </h3>
                  <span className="font-mono text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-400">
                    {badgeDefinitions.filter(b => completedNodes.includes(b.id)).length} / {LEARNING_NODE_IDS.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {badgeDefinitions.map(badge => {
                    const isEarned = completedNodes.includes(badge.id);
                    return (
                      <div 
                        key={badge.id}
                        className={`p-3 rounded-lg border flex flex-col items-center text-center gap-1.5 transition-all group relative ${
                          isEarned 
                            ? `${badge.color} border-white/10 shadow-sm cursor-help hover:scale-[1.03] duration-200` 
                            : 'bg-[#050505] border-white/5 opacity-30 select-none'
                        }`}
                        title={isEarned ? `Medalha conquistada por dominar: ${badge.desc}` : 'Bloqueado. Complete o quiz deste nó para liberar a medalha.'}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                          isEarned ? 'border-current text-emerald-400' : 'border-zinc-800 text-zinc-600'
                        }`}>
                          {renderBadgeIcon(badge.id, "w-4 h-4")}
                        </div>
                        <div className="space-y-0.5">
                          <p className={`text-[10px] font-mono font-bold leading-none ${isEarned ? 'text-zinc-100 font-bold' : 'text-zinc-500'}`}>
                            {badge.name}
                          </p>
                          <p className="text-[8px] text-zinc-500 leading-none mt-1">
                            {isEarned ? 'Conquistado!' : 'Bloqueado'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mind Map Details Display (Right side - Col 7) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {mindMapNodes[selectedNode] ? (
                <div className="p-6 bg-[#0a0a0a] rounded-xl border border-white/10 flex flex-col gap-6 animate-fade-in">
                  
                  {/* Badge & Title */}
                  <div className="border-b border-white/5 pb-4 space-y-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          {mindMapNodes[selectedNode].level}
                        </span>
                        {completedNodes.includes(selectedNode) && (
                          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono flex items-center gap-1 animate-pulse">
                            <Check className="w-3 h-3" /> Concluído
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-serif text-white tracking-wide">{mindMapNodes[selectedNode].title}</h2>
                      <p className="text-sm text-zinc-400 italic font-serif">{mindMapNodes[selectedNode].description}</p>
                    </div>
                    <p className={`px-4 py-2 rounded font-mono text-[10px] uppercase tracking-widest font-bold border flex items-center gap-1.5 w-full md:w-auto justify-center ${
                      completedNodes.includes(selectedNode)
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-[#050505] text-zinc-400 border-white/10'
                    }`}>
                      {completedNodes.includes(selectedNode) ? (
                        <><Check className="w-3.5 h-3.5" /> Nível concluído no quiz</>
                      ) : (
                        <><Award className="w-3.5 h-3.5" /> Conclua o quiz com 70%</>
                      )}
                    </p>
                  </div>

                  {/* Teoria Aplicada */}
                  <div className="space-y-2">
                    <h3 className="font-mono text-zinc-400 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      Teoria Prática Aplicada
                    </h3>
                    <p className="text-[#d4d4d8] text-sm leading-relaxed bg-[#050505]/60 p-4 rounded-lg border border-white/5">
                      {mindMapNodes[selectedNode].practicalTheory}
                    </p>
                  </div>

                  {/* Projeto Recomendado */}
                  <div className="space-y-4 bg-[#050505]/40 p-5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Code className="w-5 h-5" />
                      <h3 className="font-mono text-white text-[10px] uppercase tracking-widest">Projeto Recomendado para Construir:</h3>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-emerald-300 font-serif italic text-base">{mindMapNodes[selectedNode].recommendedProject.title}</h4>
                      <p className="text-xs text-zinc-500">{mindMapNodes[selectedNode].recommendedProject.desc}</p>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider text-[10px] font-mono">Passos para Desenvolvimento:</h5>
                      <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside">
                        {mindMapNodes[selectedNode].recommendedProject.steps.map((step, idx) => (
                          <li key={idx} className="leading-normal">{step}</li>
                        ))}
                      </ol>
                    </div>

                    {mindMapNodes[selectedNode].recommendedProject.codeTemplate && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center bg-[#050505] px-4 py-2 rounded-t border-t border-x border-white/5">
                          <span className="text-[11px] font-mono text-zinc-500">código_exemplo.py</span>
                          <button 
                            onClick={() => copyToClipboard(mindMapNodes[selectedNode].recommendedProject.codeTemplate!, selectedNode)}
                            className="text-xs hover:text-white transition-all text-zinc-400 flex items-center gap-1.5"
                          >
                            {copiedCode === selectedNode ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-mono">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="font-mono">Copiar Código</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 bg-[#050505] text-zinc-300 border-b border-x border-white/5 rounded-b font-mono text-xs overflow-x-auto leading-relaxed">
                          {mindMapNodes[selectedNode].recommendedProject.codeTemplate}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Recursos Recomendados */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="font-mono text-zinc-400 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                        <Tv className="w-4 h-4 text-emerald-400" />
                        Vídeos e Recursos Recomendados
                      </h3>
                      
                      {/* Filter controls */}
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <select
                          value={filterLevel}
                          onChange={(e) => setFilterLevel(e.target.value)}
                          aria-label="Filtrar recursos por nível"
                          className="bg-[#050505] border border-white/10 rounded px-1.5 py-1 text-zinc-400 focus:outline-none focus:border-emerald-500 font-mono text-[9px] cursor-pointer"
                        >
                          <option value="all">Nível: Todos</option>
                          <option value="iniciante">Iniciante</option>
                          <option value="básico">Básico</option>
                          <option value="intermediário">Intermediário</option>
                        </select>
                        
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          aria-label="Filtrar recursos por formato"
                          className="bg-[#050505] border border-white/10 rounded px-1.5 py-1 text-zinc-400 focus:outline-none focus:border-emerald-500 font-mono text-[9px] cursor-pointer"
                        >
                          <option value="all">Formato: Todos</option>
                          <option value="vídeo curto">Vídeo Curto</option>
                          <option value="vídeo">Vídeo Longo</option>
                          <option value="texto">Texto</option>
                          <option value="laboratório">Lab</option>
                          <option value="curso">Curso</option>
                        </select>

                        <select
                          value={filterLanguage}
                          onChange={(e) => setFilterLanguage(e.target.value)}
                          aria-label="Filtrar recursos por idioma"
                          className="bg-[#050505] border border-white/10 rounded px-1.5 py-1 text-zinc-400 focus:outline-none focus:border-emerald-500 font-mono text-[9px] cursor-pointer"
                        >
                          <option value="all">Idioma: Todos</option>
                          <option value="Português">Português</option>
                          <option value="Inglês">Inglês</option>
                        </select>

                        <select
                          value={filterCost}
                          onChange={(e) => setFilterCost(e.target.value)}
                          aria-label="Filtrar recursos por custo"
                          className="bg-[#050505] border border-white/10 rounded px-1.5 py-1 text-zinc-400 focus:outline-none focus:border-emerald-500 font-mono text-[9px] cursor-pointer"
                        >
                          <option value="all">Custo: Todos</option>
                          <option value="Gratuito">Gratuito</option>
                          <option value="Freemium">Freemium</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        const filteredResources = mindMapNodes[selectedNode].resources.filter(res => {
                          if (filterLevel !== 'all' && res.level !== filterLevel) return false;
                          if (filterType !== 'all' && res.type !== filterType) return false;
                          if (filterLanguage !== 'all' && !res.language.includes(filterLanguage)) return false;
                          if (filterCost !== 'all' && res.cost !== filterCost) return false;
                          return true;
                        });

                        if (filteredResources.length === 0) {
                          return (
                            <div className="md:col-span-2 p-6 text-center border border-dashed border-white/10 rounded-lg bg-[#050505]">
                              <p className="text-xs text-zinc-500 font-mono">Nenhum recurso encontrado com estes filtros.</p>
                            </div>
                          );
                        }

                        return filteredResources.map((res, idx) => (
                          <div key={idx} className="p-4 bg-[#0a0a0a] rounded-xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-3">
                            <div className="space-y-2">
                              {/* Badges row */}
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <span className="text-[8px] font-mono text-emerald-400 uppercase bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-400/10 font-semibold">
                                  {res.type}
                                </span>
                                <span className="text-[8px] font-mono text-blue-400 uppercase bg-blue-400/5 px-2 py-0.5 rounded border border-blue-400/10 font-semibold">
                                  {res.level}
                                </span>
                                <span className="text-[8px] font-mono text-purple-400 uppercase bg-purple-400/5 px-2 py-0.5 rounded border border-purple-400/10 font-semibold">
                                  {res.language}
                                </span>
                                <span className="text-[8px] font-mono text-amber-400 uppercase bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/10 font-semibold">
                                  {res.cost}
                                </span>
                              </div>
                              
                              <h4 className="font-serif italic font-bold text-white text-sm leading-snug">{res.title}</h4>
                              
                              <div className="space-y-1 text-[11px]">
                                <div className="flex items-start gap-1">
                                  <span className="text-zinc-500 font-mono">Canal/Plat:</span>
                                  <span className="text-zinc-300">{res.channel}</span>
                                </div>
                                <div className="flex items-start gap-1">
                                  <span className="text-zinc-500 font-mono">Pré-requisito:</span>
                                  <span className="text-zinc-300 italic">{res.prerequisites}</span>
                                </div>
                                <div className="flex items-start gap-1">
                                  <span className="text-zinc-500 font-mono">Resultado:</span>
                                  <span className="text-zinc-300">{res.learningOutcome}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="border-t border-white/5 pt-2 flex justify-end">
                              {res.url ? (
                                <a href={res.url} target="_blank" rel="noreferrer" className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer">
                                  Acessar Recurso <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <button type="button" className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer" onClick={() => setActiveTab('resources')}>
                                  Acessar Biblioteca <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Quiz Rápido Section */}
                  <div className="border-t border-white/5 pt-6 mt-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-mono text-white text-[10px] uppercase tracking-widest font-bold">
                          Quiz Rápido de Fixação
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase bg-[#050505] px-2 py-1 rounded border border-white/5">
                        Testar Aprendizado
                      </span>
                    </div>

                    {quizData[selectedNode] ? (
                      <div className="p-5 bg-[#050505] rounded-xl border border-white/5 space-y-4">
                        {!quizFinished ? (
                          <>
                            {/* Quiz Progress & Headers */}
                            <div className="flex justify-between items-center text-xs text-zinc-400">
                              <span>Questão <strong>{quizQuestionIdx + 1}</strong> de {quizData[selectedNode].length}</span>
                              <span className="font-mono text-emerald-400 font-semibold">Pontuação: {quizScore} acertos</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${((quizQuestionIdx) / quizData[selectedNode].length) * 100}%` }}
                              ></div>
                            </div>

                            {/* Question text */}
                            <h4 className="text-sm font-serif italic text-white leading-relaxed pt-1">
                              {quizData[selectedNode][quizQuestionIdx].question}
                            </h4>

                            {/* Multi-choice options */}
                            <div className="grid grid-cols-1 gap-2 pt-1">
                              {quizData[selectedNode][quizQuestionIdx].options.map((option, idx) => {
                                const isSelected = selectedAnswer === idx;
                                const isCorrect = idx === quizData[selectedNode][quizQuestionIdx].correctAnswerIndex;
                                
                                let btnStyle = "bg-[#0a0a0a] border-white/5 hover:border-white/10 text-zinc-300";
                                
                                if (isAnswerRevealed) {
                                  if (isCorrect) {
                                    btnStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-medium";
                                  } else if (isSelected) {
                                    btnStyle = "bg-red-500/10 border-red-500 text-red-400";
                                  } else {
                                    btnStyle = "bg-[#0a0a0a]/50 border-white/5 text-zinc-600 opacity-60";
                                  }
                                } else if (isSelected) {
                                  btnStyle = "bg-emerald-500/5 border-emerald-500/50 text-white font-medium";
                                }

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      if (!isAnswerRevealed) {
                                        setSelectedAnswer(idx);
                                      }
                                    }}
                                    disabled={isAnswerRevealed}
                                    className={`w-full p-3.5 text-left text-xs rounded-lg border transition-all duration-200 flex items-start gap-3 ${btnStyle}`}
                                  >
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-mono ${
                                      isAnswerRevealed && isCorrect 
                                        ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" 
                                        : isAnswerRevealed && isSelected 
                                          ? "border-red-500 text-red-400 bg-red-500/10"
                                          : isSelected
                                            ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/5"
                                            : "border-zinc-700 text-zinc-500"
                                    }`}>
                                      {isAnswerRevealed && isCorrect ? (
                                        <Check className="w-3 h-3" />
                                      ) : isAnswerRevealed && isSelected ? (
                                        <XCircle className="w-3 h-3" />
                                      ) : (
                                        String.fromCharCode(65 + idx)
                                      )}
                                    </div>
                                    <span className="leading-relaxed">{option.substring(3)}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Feedback Block */}
                            {isAnswerRevealed && (
                              <div className="p-4 rounded-lg bg-[#0a0a0a] border border-white/5 space-y-2 text-xs animate-fade-in">
                                <p className="font-semibold flex items-center gap-1.5">
                                  {selectedAnswer === quizData[selectedNode][quizQuestionIdx].correctAnswerIndex ? (
                                    <span className="text-emerald-400 flex items-center gap-1">
                                      <Check className="w-4 h-4" /> Resposta Correta!
                                    </span>
                                  ) : (
                                    <span className="text-red-400 flex items-center gap-1">
                                      <XCircle className="w-4 h-4" /> Resposta Incorreta!
                                    </span>
                                  )}
                                </p>
                                <p className="text-zinc-400 leading-relaxed font-sans">
                                  {quizData[selectedNode][quizQuestionIdx].explanation}
                                </p>
                              </div>
                            )}

                            {/* Action Button */}
                            <div className="flex justify-end pt-1">
                              {!isAnswerRevealed ? (
                                <button
                                  onClick={() => {
                                    if (selectedAnswer !== null) {
                                      setIsAnswerRevealed(true);
                                      if (selectedAnswer === quizData[selectedNode][quizQuestionIdx].correctAnswerIndex) {
                                        setQuizScore(prev => prev + 1);
                                      }
                                    }
                                  }}
                                  disabled={selectedAnswer === null}
                                  className="px-5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-[10px] uppercase tracking-widest font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  Verificar Resposta
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (quizQuestionIdx + 1 < quizData[selectedNode].length) {
                                      setQuizQuestionIdx(prev => prev + 1);
                                      setSelectedAnswer(null);
                                      setIsAnswerRevealed(false);
                                    } else {
                                      setQuizFinished(true);
                                      const requiredScore = Math.ceil(quizData[selectedNode].length * 0.7);
                                      if (quizScore >= requiredScore && !completedNodes.includes(selectedNode)) {
                                        setCompletedNodes(prev => [...prev, selectedNode]);
                                        recordStudyActivity();
                                      }
                                    }
                                  }}
                                  className="px-5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-[10px] uppercase tracking-widest font-bold transition-all"
                                >
                                  {quizQuestionIdx + 1 < quizData[selectedNode].length ? "Próxima Questão" : "Ver Resultado Final"}
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          /* Quiz Finished Screen */
                          <div className="py-6 text-center space-y-4 animate-fade-in flex flex-col items-center">
                            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
                              <Award className="w-8 h-8" />
                            </div>
                            <div className="space-y-1.5 max-w-sm">
                              <h4 className="text-base font-serif text-white font-bold">Quiz Concluído!</h4>
                              <p className="text-xs text-zinc-400">
                                Você acertou <strong className="text-emerald-400">{quizScore} de {quizData[selectedNode].length}</strong> questões sobre <strong>{mindMapNodes[selectedNode].title}</strong>.
                              </p>
                              {quizScore >= Math.ceil(quizData[selectedNode].length * 0.7) ? (
                                <p className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded mt-2">
                                  🔥 Nível concluído: você atingiu os 70% mínimos de aproveitamento.
                                </p>
                              ) : quizScore >= 1 ? (
                                <p className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded mt-2">
                                  ⚡ São necessários {Math.ceil(quizData[selectedNode].length * 0.7)} acertos para concluir este nível. Revise e tente novamente.
                                </p>
                              ) : (
                                <p className="text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded mt-2">
                                  ⚠️ São necessários {Math.ceil(quizData[selectedNode].length * 0.7)} acertos para concluir este nível. Tente novamente após revisar o conteúdo.
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setQuizQuestionIdx(0);
                                setSelectedAnswer(null);
                                setIsAnswerRevealed(false);
                                setQuizScore(0);
                                setQuizFinished(false);
                              }}
                              className="px-5 py-2.5 bg-[#0a0a0a] hover:bg-zinc-900 border border-white/10 text-white rounded font-mono text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Refazer Quiz
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">Nenhum quiz disponível para este nó.</p>
                    )}
                  </div>

                </div>
              ) : (
                <div className="p-12 text-center text-zinc-500 bg-[#0a0a0a] rounded-xl border border-white/5">
                  Selecione um nó do mapa à esquerda para começar.
                </div>
              )}
            </div>

          </div>
        )}

        {/* LAB TAB (VULNERABILITY SIMULATOR) */}
        {activeTab === 'lab' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            
            {/* Lab Intro */}
            <div className="p-6 bg-[#0a0a0a] rounded-xl border border-white/10">
              <h2 className="text-xl font-serif text-white flex items-center gap-2">
                <Terminal className="w-6 h-6 text-emerald-400" />
                Laboratório Prático de Código e Exploits
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Aprenda fazendo em uma simulação local e conceitual: nenhum ataque atinge sistemas reais e nenhum código enviado é executado. Alterne entre os modos vulnerável e protegido para entender a causa e a mitigação de cada falha.
              </p>
            </div>

            {/* Lab 1: SQL Injection */}
            <div className="p-6 bg-[#0a0a0a] rounded-xl border border-white/10 flex flex-col gap-6">
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      OWASP A03:2021
                    </span>
                    <h3 className="text-lg font-serif italic text-white mt-1.5 flex items-center gap-1.5">
                      1. Injeção de SQL (SQLi)
                    </h3>
                  </div>
                  
                  {/* Security Toggle Toggle */}
                  <button 
                    onClick={() => {
                      if (sqliTimerRef.current !== null) {
                        window.clearTimeout(sqliTimerRef.current);
                        sqliTimerRef.current = null;
                      }
                      setSqliSecure(!sqliSecure);
                      setSqliResult({ status: 'idle', data: [], query: '' });
                    }}
                    className={`relative group px-3 py-1.5 rounded text-xs font-bold font-mono transition-all flex items-center gap-2 border ${sqliSecure ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-pointer' : 'bg-red-500/10 border-red-500/20 text-red-400 cursor-pointer'}`}
                  >
                    {sqliSecure ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Código Seguro
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        Código Vulnerável
                      </>
                    )}

                    {/* Tooltip 'Dica Rápida' */}
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex flex-col gap-1 w-80 bg-[#050505] border border-white/10 p-3.5 rounded-lg text-left text-[11px] text-zinc-300 font-sans leading-relaxed shadow-2xl z-50 pointer-events-none transition-all">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-[9px] uppercase tracking-wider">
                        <HelpCircle className="w-3.5 h-3.5" /> Explicação do Exploit
                      </div>
                      <p className="font-semibold text-white mt-1 text-xs">
                        {sqliSecure ? "Prepared Statements (Código Seguro)" : "Injeção de SQL (Código Vulnerável)"}
                      </p>
                      <p className="text-zinc-400 font-medium">
                        {sqliSecure 
                          ? "As consultas preparadas tratam o seu input estritamente como um dado de texto puro. Mesmo que você envie aspas ou comandos SQL, eles nunca serão compilados ou executados pelo banco de dados."
                          : "Ao concatenar diretamente o texto do input na query SQL, o comando malicioso ' OR '1'='1 é interpretado como instrução lógica do banco. O resultado sempre retorna verdadeiro para todos os usuários, vazando os hashes."
                        }
                      </p>
                    </div>
                  </button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Injeção de SQL ocorre quando dados do usuário são concatenados diretamente em consultas do banco de dados sem tratamento. O invasor pode manipular comandos para roubar dados inteiros.
                </p>

                {/* Input block */}
                <div className="space-y-2">
                  <label htmlFor="sqli-input" className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold block">Digite o input de busca ou clique na sugestão de exemplo:</label>
                  <div className="flex gap-2">
                    <input 
                      id="sqli-input"
                      type="text" 
                      value={sqliInput}
                      onChange={(e) => setSqliInput(e.target.value)}
                      className="flex-1 bg-[#050505] border border-white/10 rounded px-4 py-2 font-mono text-xs focus:outline-none focus:border-emerald-500 text-zinc-200"
                    />
                    <button 
                      onClick={handleRunSqli}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs uppercase tracking-wider font-bold px-4 rounded transition-all cursor-pointer"
                    >
                      Testar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-zinc-500 self-center font-mono">Presets rápidos:</span>
                    <button 
                      onClick={() => setSqliInput("' OR '1'='1")}
                      className="text-[10px] bg-[#050505] hover:bg-zinc-900 border border-white/10 rounded px-2 py-0.5 text-zinc-300 font-mono cursor-pointer"
                    >
                      ' OR '1'='1
                    </button>
                    <button 
                      onClick={() => setSqliInput("joao_silva")}
                      className="text-[10px] bg-[#050505] hover:bg-zinc-900 border border-white/10 rounded px-2 py-0.5 text-zinc-300 font-mono cursor-pointer"
                    >
                      joao_silva (Seguro)
                    </button>
                  </div>
                </div>

                {/* Simulated Query Box */}
                <div className="p-4 bg-[#050505] rounded border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-500">Query SQL executada no Servidor:</span>
                  <div className="font-mono text-xs text-emerald-400 break-all leading-normal">
                    {sqliSecure ? (
                      <span>
                        db.execute("<span className="text-white">SELECT * FROM usuarios WHERE username = ?</span>", ["<span className="text-amber-400">{sqliInput}</span>"])
                      </span>
                    ) : (
                      <span>
                        SELECT * FROM usuarios WHERE username = '<span className="text-amber-400">{sqliInput}</span>'
                      </span>
                    )}
                  </div>
                </div>

                {/* Simulated Results Console */}
                <div className="flex-1 min-h-[140px] bg-[#050505] rounded border border-white/5 p-4 font-mono text-xs flex flex-col gap-2">
                  <div className="text-zinc-500 border-b border-white/5 pb-1.5 flex justify-between items-center">
                    <span>Resultado do Banco de Dados:</span>
                    {sqliResult.status === 'vulnerable_breached' && (
                      <span className="text-red-400 flex items-center gap-1 animate-pulse font-bold text-[10px]">
                        <AlertTriangle className="w-3 h-3" /> SIMULAÇÃO: VAZAMENTO ILUSTRADO
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {sqliResult.status === 'idle' && (
                      <div className="text-zinc-600 italic">Insira os dados e clique em "Testar" para ver o resultado do servidor.</div>
                    )}
                    {sqliResult.status === 'loading' && (
                      <div className="text-emerald-400 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Conectando ao MySQL/Postgres simulado...
                      </div>
                    )}
                    {sqliResult.status === 'success' && (
                      <div className="space-y-1">
                        <div className="text-zinc-500">[info] Busca completada em 12ms.</div>
                        <div className="text-emerald-400">Total de registros encontrados: 0</div>
                        <div className="text-zinc-600 italic">Nenhum usuário correspondente aos dados inseridos foi encontrado.</div>
                      </div>
                    )}
                    {sqliResult.status === 'vulnerable_breached' && (
                      <div className="space-y-2">
                        <div className="text-red-400 font-bold">[VULNERABILIDADE DETECTADA]</div>
                        <div className="text-zinc-300 leading-relaxed">Graças ao input <span className="text-amber-400">OR '1'='1'</span>, a cláusula SQL sempre resultou em verdadeiro. O servidor retornou toda a tabela de cadastros:</div>
                        
                        <div className="overflow-x-auto border border-white/5 rounded">
                          <table className="w-full text-left text-[11px] text-zinc-300">
                            <thead className="bg-[#0a0a0a] font-bold text-zinc-400">
                              <tr>
                                <th className="p-1.5 font-mono">ID</th>
                                <th className="p-1.5 font-mono">User</th>
                                <th className="p-1.5 font-mono">Senha Hash</th>
                                <th className="p-1.5 font-mono">Cargo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sqliResult.data.map((row) => (
                                <tr key={row.id} className="border-t border-white/5">
                                  <td className="p-1.5 text-emerald-400 font-mono">{row.id}</td>
                                  <td className="p-1.5 font-bold text-white">{row.usuario}</td>
                                  <td className="p-1.5 text-zinc-600 font-mono">{row.hash_senha}</td>
                                  <td className="p-1.5 text-amber-400">{row.cargo}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Lab 2: Cross-Site Scripting (XSS) */}
              <div className="p-6 bg-[#0a0a0a] rounded-xl border border-white/10 flex flex-col gap-6">
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      OWASP A03:2021
                    </span>
                    <h3 className="text-lg font-serif italic text-white mt-1.5 flex items-center gap-1.5">
                      2. Cross-Site Scripting (XSS)
                    </h3>
                  </div>
                  
                  {/* Security Toggle Toggle */}
                  <button 
                    onClick={() => {
                      setXssSecure(!xssSecure);
                      setXssTriggered(false);
                      setXssOutput("");
                    }}
                    className={`relative group px-3 py-1.5 rounded text-xs font-bold font-mono transition-all flex items-center gap-2 border ${xssSecure ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-pointer' : 'bg-red-500/10 border-red-500/20 text-red-400 cursor-pointer'}`}
                  >
                    {xssSecure ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Escape Seguro de HTML
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        Código Vulnerável (HTML Direto)
                      </>
                    )}

                    {/* Tooltip 'Dica Rápida' */}
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex flex-col gap-1 w-80 bg-[#050505] border border-white/10 p-3.5 rounded-lg text-left text-[11px] text-zinc-300 font-sans leading-relaxed shadow-2xl z-50 pointer-events-none transition-all">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-[9px] uppercase tracking-wider">
                        <HelpCircle className="w-3.5 h-3.5" /> Explicação do Exploit
                      </div>
                      <p className="font-semibold text-white mt-1 text-xs">
                        {xssSecure ? "Sanitização / Escape (Código Seguro)" : "Cross-Site Scripting (Código Vulnerável)"}
                      </p>
                      <p className="text-zinc-400 font-medium">
                        {xssSecure 
                          ? "Antes de exibir na tela, caracteres como < e > são convertidos em entidades seguras (&lt; e &gt;). O navegador renderiza como texto inofensivo e nunca interpreta como script executável."
                          : "O site aceita HTML direto e o injeta na página sem filtros. Se o usuário mandar <script>, o navegador baixa e roda o código como se fosse legítimo da própria página, permitindo roubo de cookies."
                        }
                      </p>
                    </div>
                  </button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  XSS ocorre quando um site exibe entradas de texto do usuário diretamente no navegador sem sanitização, permitindo que invasores executem códigos em JavaScript maliciosos para roubar cookies de login.
                </p>

                {/* Input block */}
                <div className="space-y-2">
                  <label htmlFor="xss-input" className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold block">Digite um exemplo de entrada ou teste o preset:</label>
                  <div className="flex gap-2">
                    <input 
                      id="xss-input"
                      type="text" 
                      value={xssInput}
                      onChange={(e) => setXssInput(e.target.value)}
                      className="flex-1 bg-[#050505] border border-white/10 rounded px-4 py-2 font-mono text-xs focus:outline-none focus:border-emerald-500 text-zinc-200"
                    />
                    <button 
                      onClick={handleRunXss}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs uppercase tracking-wider font-bold px-4 rounded transition-all cursor-pointer"
                    >
                      Executar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-zinc-500 self-center font-mono">Presets rápidos:</span>
                    <button 
                      onClick={() => setXssInput("<script>alert('Ataque Hack!')</script>")}
                      className="text-[10px] bg-[#050505] hover:bg-zinc-900 border border-white/10 rounded px-2 py-0.5 text-zinc-300 font-mono cursor-pointer"
                    >
                      Injetar Script alert()
                    </button>
                    <button 
                      onClick={() => setXssInput("Parabéns pelo ótimo artigo!")}
                      className="text-[10px] bg-[#050505] hover:bg-zinc-900 border border-white/10 rounded px-2 py-0.5 text-zinc-300 font-mono cursor-pointer"
                    >
                      Texto Comum (Seguro)
                    </button>
                  </div>
                </div>

                {/* Renders safely */}
                <div className="p-4 bg-[#050505] rounded border border-white/5 space-y-1.5 flex-1 flex flex-col min-h-[140px]">
                  <span className="text-[10px] font-mono text-zinc-500">Visualização na Tela do Usuário (Navegador):</span>
                  
                  <div className="flex-1 flex items-center justify-center border border-white/5 p-4 rounded bg-[#0a0a0a]/50 relative">
                    {xssTriggered ? (
                      <div className="w-full">
                        {xssSecure ? (
                          <div className="text-zinc-300 font-mono text-xs break-all bg-[#050505] p-2.5 rounded border border-white/10">
                            {xssOutput}
                            <div className="text-[10px] text-emerald-400 mt-2 font-sans font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Renderizado de forma segura como texto plano (escapado). Nenhum código rodou.
                            </div>
                          </div>
                        ) : (
                          <div className="w-full space-y-3">
                            <div className="p-2.5 bg-red-950/20 border border-red-800/40 rounded text-red-300 text-xs text-center font-bold animate-pulse flex flex-col items-center gap-1">
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                              ⚠️ SIMULAÇÃO DE EXPLOIT — nenhum script é executado.
                            </div>
                            
                            {/* Interactive script simulation trigger box */}
                            {xssInput.includes("<script>") && (
                              <div className="bg-amber-500 text-slate-950 p-3 rounded border border-amber-400 shadow-xl max-w-xs mx-auto text-center space-y-2 animate-bounce">
                                <h4 className="font-extrabold text-xs">Simulação de Alerta Ativado</h4>
                                <p className="text-[10px] font-mono leading-tight">{xssInput}</p>
                                <button onClick={() => setXssTriggered(false)} className="bg-slate-950 text-white font-bold text-[9px] px-2 py-1 rounded cursor-pointer">Fechar Alerta</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-600 italic text-xs font-mono">Aguardando envio...</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Lab 3: Brute Force & Rate Limiting */}
              <div className="lg:col-span-2 p-6 bg-[#0a0a0a] rounded-xl border border-white/10 flex flex-col gap-6">
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      OWASP A07:2021
                    </span>
                    <h3 className="text-lg font-serif italic text-white mt-1.5 flex items-center gap-1.5">
                      3. Ataque de Força Bruta (Brute Force)
                    </h3>
                  </div>
                  
                  {/* Security Toggle Toggle */}
                  <button 
                    onClick={() => {
                      if (bruteForceTimerRef.current !== null) {
                        window.clearInterval(bruteForceTimerRef.current);
                        bruteForceTimerRef.current = null;
                      }
                      setBruteForceActive(false);
                      setBruteForceSecure(!bruteForceSecure);
                      setBruteForceAttempts([]);
                      setBruteForceStatusText("Inativo");
                      setBruteForceProgress(0);
                    }}
                    className={`relative group px-3 py-1.5 rounded text-xs font-bold font-mono transition-all flex items-center gap-2 border ${bruteForceSecure ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-pointer' : 'bg-red-500/10 border-red-500/20 text-red-400 cursor-pointer'}`}
                  >
                    {bruteForceSecure ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Rate Limiting Ativo (Max 3 requisições)
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        Sem Limite de Tentativas (Vulnerável)
                      </>
                    )}

                    {/* Tooltip 'Dica Rápida' */}
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex flex-col gap-1 w-80 bg-[#050505] border border-white/10 p-3.5 rounded-lg text-left text-[11px] text-zinc-300 font-sans leading-relaxed shadow-2xl z-50 pointer-events-none transition-all">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-[9px] uppercase tracking-wider">
                        <HelpCircle className="w-3.5 h-3.5" /> Explicação do Exploit
                      </div>
                      <p className="font-semibold text-white mt-1 text-xs">
                        {bruteForceSecure ? "Rate Limiting (Código Seguro)" : "Ataque de Dicionário (Código Vulnerável)"}
                      </p>
                      <p className="text-zinc-400 font-medium">
                        {bruteForceSecure 
                          ? "Se o servidor detectar um número excessivo de logins incorretos do mesmo IP, ele bloqueia temporariamente novos acessos enviando um cabeçalho de erro (HTTP 429), impedindo tentativas em lote."
                          : "Sem limites de requisições por segundo, o invasor dispara robôs de força bruta com listas de milhões de senhas até adivinhar as credenciais de um usuário ou administrador."
                        }
                      </p>
                    </div>
                  </button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Sem limites de tentativas ou políticas de atraso, invasores podem rodar dicionários contendo milhões de senhas comuns contra o formulário de login até adivinhar a senha correta de um administrador.
                </p>

                {/* Simulation Control Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* Control */}
                  <div className="md:col-span-4 space-y-4">
                    <div className="bg-[#050505] p-4 rounded border border-white/5 space-y-3">
                      <span className="text-xs font-bold text-zinc-400 block font-serif">Console de Ataque</span>
                      <button 
                        onClick={handleRunBruteForce}
                        disabled={bruteForceActive}
                        className={`w-full py-2 px-4 rounded font-mono uppercase tracking-wider font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${bruteForceActive ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5' : 'bg-red-500 hover:bg-red-400 text-white'}`}
                      >
                        <Play className="w-3.5 h-3.5" />
                        Disparar Força Bruta
                      </button>
                      
                      <div className="space-y-1">
                        <div className="text-[10px] text-zinc-500 font-mono">Status do Processo:</div>
                        <div className="text-xs font-mono font-bold text-zinc-300">{bruteForceStatusText}</div>
                      </div>

                      {bruteForceProgress > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                            <span>Progresso:</span>
                            <span>{bruteForceProgress}%</span>
                          </div>
                          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-red-500 h-1.5 transition-all duration-300" style={{ width: `${bruteForceProgress}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terminal view */}
                  <div className="md:col-span-8 space-y-2">
                    <span className="text-xs text-zinc-400 font-bold block font-serif">Histórico de Conexão no Servidor (Logs):</span>
                    <div className="bg-[#050505] rounded border border-white/5 p-4 font-mono text-[11px] h-48 overflow-y-auto space-y-1.5 leading-normal">
                      {bruteForceAttempts.length === 0 ? (
                        <div className="text-zinc-600 italic">Pronto para simular. Clique em "Disparar Força Bruta" para ver a enxurrada de acessos no servidor.</div>
                      ) : (
                        bruteForceAttempts.map((attempt, idx) => (
                          <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-1">
                            <div>
                              <span className="text-zinc-500">[POST /login]</span>{' '}
                              <span>tentativa com senha: <strong className="text-amber-400">{attempt.pass}</strong></span>
                            </div>
                            <span className={`font-bold ${attempt.status.includes("SUCESSO") ? 'text-emerald-400' : attempt.status.includes("Bloqueado") ? 'text-red-400 animate-pulse' : 'text-zinc-500'}`}>
                              {attempt.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            
            {/* Header Info */}
            <div className="p-6 bg-[#0a0a0a] rounded-xl border border-white/10">
              <h2 className="text-xl font-serif text-white flex items-center gap-2">
                <Code className="w-6 h-6 text-emerald-400" />
                4 Projetos Práticos Essenciais para o seu Portfólio
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                A melhor forma de aprender programação e segurança cibernética é construindo suas próprias ferramentas. Aqui estão quatro projetos que simulam tarefas do dia a dia de um profissional de segurança (Pentester ou Defensor). Copie os códigos e execute-os na sua máquina!
              </p>
            </div>

            {/* Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Project 1 */}
              <div className="p-6 bg-[#0a0a0a] rounded-xl border border-white/10 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded uppercase font-bold">Python & Rede</span>
                    <h3 className="text-base font-serif italic text-white mt-1">1. Port Scanner de Rede</h3>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Varre portas lógicas de um endereço IP para descobrir quais serviços de rede (como sites, servidores de arquivo ou SSH) estão rodando de forma exposta na máquina alvo.
                </p>
                <div className="space-y-1 bg-[#050505] p-3 rounded border border-white/5">
                  <div className="flex justify-between text-[11px] font-mono text-zinc-500 border-b border-white/5 pb-1 mb-1">
                    <span>port_scanner.py</span>
                    <button onClick={() => copyToClipboard(mindMapNodes['python-sec'].recommendedProject.codeTemplate!, 'p1')} className="text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer">
                      {copiedCode === 'p1' ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-48 overflow-y-auto">
                    {mindMapNodes['python-sec'].recommendedProject.codeTemplate}
                  </pre>
                </div>
              </div>

              {/* Project 2 */}
              <div className="p-6 bg-[#0a0a0a] rounded-xl border border-white/10 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded uppercase font-bold">Python & Sec</span>
                    <h3 className="text-base font-serif italic text-white mt-1">2. Gerador de Hash de Integridade</h3>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Calcula assinaturas únicas (SHA-256) de arquivos de configuração críticos para alertar instantaneamente se um invasor ou malware alterar alguma linha do documento.
                </p>
                <div className="space-y-1 bg-[#050505] p-3 rounded border border-white/5">
                  <div className="flex justify-between text-[11px] font-mono text-zinc-500 border-b border-white/5 pb-1 mb-1">
                    <span>validador_integridade.py</span>
                    <button onClick={() => copyToClipboard(mindMapNodes['cryptography'].recommendedProject.codeTemplate!, 'p2')} className="text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer">
                      {copiedCode === 'p2' ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-48 overflow-y-auto">
                    {mindMapNodes['cryptography'].recommendedProject.codeTemplate}
                  </pre>
                </div>
              </div>

              {/* Project 3 */}
              <div className="p-6 bg-[#0a0a0a] rounded-xl border border-white/10 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded uppercase font-bold">Blue Team / Defesa</span>
                    <h3 className="text-base font-serif italic text-white mt-1">3. Analisador de Logs Repetitivos</h3>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Funciona como um mini-IDS (Sistema de Detecção de Intrusão). Ele varre logs de tráfego web do servidor local e notifica em vermelho se IPs externos tentarem ataques ou varreduras.
                </p>
                <div className="space-y-1 bg-[#050505] p-3 rounded border border-white/5">
                  <div className="flex justify-between text-[11px] font-mono text-zinc-500 border-b border-white/5 pb-1 mb-1">
                    <span>ids_logger.py</span>
                    <button onClick={() => copyToClipboard(mindMapNodes['pentest'].recommendedProject.codeTemplate!, 'p3')} className="text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer">
                      {copiedCode === 'p3' ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-48 overflow-y-auto">
                    {mindMapNodes['pentest'].recommendedProject.codeTemplate}
                  </pre>
                </div>
              </div>

              {/* Project 4 */}
              <div className="p-6 bg-[#0a0a0a] rounded-xl border border-white/10 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded uppercase font-bold">Python / Web Sec</span>
                    <h3 className="text-base font-serif italic text-white mt-1">4. HTTP Header Security Checker</h3>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Inspeciona se qualquer site comercial de compras ou bancos possui os cabeçalhos mínimos recomendados de segurança exigidos internacionalmente para prevenir fraudes.
                </p>
                <div className="space-y-1 bg-[#050505] p-3 rounded border border-white/5">
                  <div className="flex justify-between text-[11px] font-mono text-zinc-500 border-b border-white/5 pb-1 mb-1">
                    <span>header_checker.py</span>
                    <button onClick={() => copyToClipboard(mindMapNodes['owasp-web'].recommendedProject.codeTemplate!, 'p4')} className="text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer">
                      {copiedCode === 'p4' ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-48 overflow-y-auto">
                    {mindMapNodes['owasp-web'].recommendedProject.codeTemplate}
                  </pre>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* RESOURCES & VIDEOS TAB */}
        {activeTab === 'resources' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            
            {/* Header */}
            <div className="p-6 bg-[#0a0a0a] rounded-xl border border-white/10 space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-serif text-white flex items-center gap-2">
                  <Tv className="w-6 h-6 text-emerald-400" />
                  Hub de Aprendizado: Aulas, Cursos e Plataformas
                </h2>
                <p className="text-sm text-zinc-400">
                  Potencialize seus estudos com cursos estruturados, videoaulas didáticas e laboratórios de simulação. Selecionamos as melhores opções para facilitar seu aprendizado, de canais básicos a treinamentos especializados.
                </p>
              </div>

              {/* Sub Tab Switcher */}
              <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
                <button
                  onClick={() => setResourcesSubTab('free')}
                  className={`px-4 py-2 rounded font-mono text-[10px] uppercase tracking-wider font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    resourcesSubTab === 'free'
                      ? 'bg-emerald-500 text-slate-950 border-transparent'
                      : 'bg-[#050505] hover:bg-[#0a0a0a] border-white/10 text-zinc-400'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Cursos 100% Gratuitos (PT-BR)
                </button>
                <button
                  onClick={() => setResourcesSubTab('premium')}
                  className={`px-4 py-2 rounded font-mono text-[10px] uppercase tracking-wider font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    resourcesSubTab === 'premium'
                      ? 'bg-emerald-500 text-slate-950 border-transparent'
                      : 'bg-[#050505] hover:bg-[#0a0a0a] border-white/10 text-zinc-400'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Treinamentos Avançados
                </button>
                <button
                  onClick={() => setResourcesSubTab('links')}
                  className={`px-4 py-2 rounded font-mono text-[10px] uppercase tracking-wider font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    resourcesSubTab === 'links'
                      ? 'bg-emerald-500 text-slate-950 border-transparent'
                      : 'bg-[#050505] hover:bg-[#0a0a0a] border-white/10 text-zinc-400'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Canais &amp; Labs de Prática
                </button>
              </div>
            </div>

            {/* Sub-tab 1: FREE COURSES (PT-BR) */}
            {resourcesSubTab === 'free' && (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs text-zinc-300 space-y-1">
                  <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Recomendação Especial para Iniciantes com Dificuldade de Aprendizado
                  </p>
                  <p className="leading-relaxed">
                    Comece pelos cursos que combinam conteúdo estruturado, linguagem acessível e exercícios práticos. Confira no destino as condições atuais de matrícula, idioma e certificado antes de iniciar.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Free Course 1: NetAcad */}
                  <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-4 flex flex-col justify-between hover:border-white/20 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">
                          Cisco Networking Academy
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">Introdução</span>
                      </div>
                      <h3 className="font-serif italic text-white text-base font-semibold">Introdução à Cibersegurança</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Curso introdutório com conceitos de redes, ameaças e práticas de proteção. A plataforma apresenta atividades interativas e o acesso pode requerer uma conta gratuita.
                      </p>
                      <div className="space-y-1.5 border-t border-white/5 pt-3">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Custo:</span>
                          <span className="text-emerald-400 font-bold">Ver condições na plataforma</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Destaque:</span>
                          <span className="text-zinc-300 font-sans italic">Laboratórios visuais simplificados</span>
                        </div>
                      </div>
                    </div>
                    <a href="https://www.netacad.com/courses/introduction-to-cybersecurity" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                      Acessar o curso <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Free Course 2: Fundação Bradesco */}
                  <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-4 flex flex-col justify-between hover:border-white/20 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">
                          Fundação Bradesco (EV)
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">Fundamentos</span>
                      </div>
                      <h3 className="font-serif italic text-white text-base font-semibold">Segurança em Tecnologia da Informação</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Curso planejado do zero com linguagem coloquial e direta, ideal para quem se assusta com a sopa de letrinhas técnica. Ensina os pilares básicos de integridade, confidencialidade, senhas e firewalls de modo passo a passo.
                      </p>
                      <div className="space-y-1.5 border-t border-white/5 pt-3">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Custo:</span>
                          <span className="text-emerald-400 font-bold">100% Grátis com Certificado</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Destaque:</span>
                          <span className="text-zinc-300 font-sans italic">Extremamente amigável para iniciantes</span>
                        </div>
                      </div>
                    </div>
                    <a href="https://www.ev.org.br/cursos/seguranca-em-tecnologia-da-informacao" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                      Acessar o curso <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Free Course 3: EVG / CIS Controls */}
                  <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-4 flex flex-col justify-between hover:border-white/20 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">
                          Escola Virtual de Governo
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">Fundamentos</span>
                      </div>
                      <h3 className="font-serif italic text-white text-base font-semibold">Fundamentos da Segurança Cibernética — CIS Controls</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Introdução aos controles de segurança cibernética e às práticas de proteção aplicáveis a organizações. O curso é oferecido pela Escola Virtual de Governo.
                      </p>
                      <div className="space-y-1.5 border-t border-white/5 pt-3">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Custo:</span>
                          <span className="text-emerald-400 font-bold">Gratuito</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Destaque:</span>
                          <span className="text-zinc-300 font-sans italic">Controles de segurança e gestão de riscos</span>
                        </div>
                      </div>
                    </div>
                    <a href="https://www.escolavirtual.gov.br/curso/1153" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                      Acessar o curso <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Free Course 4: EVG / Enap */}
                  <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-4 flex flex-col justify-between hover:border-white/20 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">
                          Escola Virtual de Governo
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">Cidadania &amp; TI</span>
                      </div>
                      <h3 className="font-serif italic text-white text-base font-semibold">Segurança da Informação para Todos</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Curso introdutório sobre cuidados com dados, privacidade e práticas de segurança digital para o cotidiano.
                      </p>
                      <div className="space-y-1.5 border-t border-white/5 pt-3">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Custo:</span>
                          <span className="text-emerald-400 font-bold">100% Gratuito (MEC/Enap)</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Destaque:</span>
                          <span className="text-zinc-300 font-sans italic">Aplicações práticas para o dia a dia</span>
                        </div>
                      </div>
                    </div>
                    <a href="https://www.escolavirtual.gov.br/curso/1256" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                      Acessar o curso <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                </div>
              </div>
            )}

            {/* Sub-tab 2: PREMIUM COURSES (PAID, BUT HIGHLY EFFECTIVE) */}
            {resourcesSubTab === 'premium' && (
              <div className="space-y-6">
                <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 text-xs text-zinc-300 space-y-1">
                  <p className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Por que investir em um Treinamento de Elite?
                  </p>
                  <p className="leading-relaxed">
                    São opções para aprofundar a trilha depois dos fundamentos. Verifique no site de cada fornecedor o programa, a modalidade, o preço, o suporte e a disponibilidade atual antes de comprar.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Premium Course 1: Desec Security */}
                  <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-4 flex flex-col justify-between hover:border-white/20 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold bg-amber-400/10 border border-amber-400/20 text-amber-400 px-2 py-0.5 rounded uppercase">
                          Desec Security
                        </span>
                        <span className="text-xs font-mono text-amber-400 font-bold">Curso pago</span>
                      </div>
                      <h3 className="font-serif italic text-white text-base font-semibold">Treinamento de Pentest Profissional (DCPT)</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        A referência nacional indiscutível em segurança ofensiva. O curso é focado no método "mão na massa" com suporte extraordinário no fórum de alunos. Ideal para quem precisa de explicações super detalhadas e exercícios práticos constantes.
                      </p>
                      <div className="space-y-1.5 border-t border-white/5 pt-3">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Diferencial:</span>
                          <span className="text-amber-400 font-bold">Suporte direto por instrutores especializados</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Foco:</span>
                          <span className="text-zinc-300 font-sans italic">Auditoria de Sistemas &amp; Pentest do zero ao avançado</span>
                        </div>
                      </div>
                    </div>
                    <a href="https://desecsecurity.com/" target="_blank" rel="noreferrer" className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                      Ver Treinamento Desec <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Advanced Course 2: PortSwigger */}
                  <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-4 flex flex-col justify-between hover:border-white/20 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold bg-amber-400/10 border border-amber-400/20 text-amber-400 px-2 py-0.5 rounded uppercase">
                          PortSwigger
                        </span>
                        <span className="text-xs font-mono text-emerald-400 font-bold">Gratuito</span>
                      </div>
                      <h3 className="font-serif italic text-white text-base font-semibold">Web Security Academy</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Plataforma oficial de aprendizado em segurança web, com trilhas e laboratórios interativos para estudar vulnerabilidades em ambiente controlado.
                      </p>
                      <div className="space-y-1.5 border-t border-white/5 pt-3">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Diferencial:</span>
                          <span className="text-amber-400 font-bold">Laboratórios guiados e interativos</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Foco:</span>
                          <span className="text-zinc-300 font-sans italic">Segurança de aplicações web</span>
                        </div>
                      </div>
                    </div>
                    <a href="https://portswigger.net/web-security" target="_blank" rel="noreferrer" className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                      Acessar Web Security Academy <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Premium Course 3: Solyd Offensive Security */}
                  <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-4 flex flex-col justify-between hover:border-white/20 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold bg-amber-400/10 border border-amber-400/20 text-amber-400 px-2 py-0.5 rounded uppercase">
                          SOLYD Offensive Security
                        </span>
                        <span className="text-xs font-mono text-amber-400 font-bold">Curso pago</span>
                      </div>
                      <h3 className="font-serif italic text-white text-base font-semibold">Formação Pentest Profissional &amp; Python para Hackers</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Uma excelente formação para quem quer aprender as fases de pentest de forma direta e estruturada, combinando lógica de programação em Python com técnicas de invasão seguras e legítimas.
                      </p>
                      <div className="space-y-1.5 border-t border-white/5 pt-3">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Diferencial:</span>
                          <span className="text-amber-400 font-bold">Aulas curtas, focadas e sem rodeios teóricos</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Foco:</span>
                          <span className="text-zinc-300 font-sans italic">Prática rápida de automação em Python para segurança</span>
                        </div>
                      </div>
                    </div>
                    <a href="https://solyd.com.br/" target="_blank" rel="noreferrer" className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                      Acessar SOLYD Security <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Premium Course 4: Google Cybersecurity Certificate */}
                  <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-4 flex flex-col justify-between hover:border-white/20 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold bg-amber-400/10 border border-amber-400/20 text-amber-400 px-2 py-0.5 rounded uppercase">
                          Google / Coursera
                        </span>
                        <span className="text-xs font-mono text-amber-400 font-bold">Curso pago</span>
                      </div>
                      <h3 className="font-serif italic text-white text-base font-semibold">Google Cybersecurity Professional Certificate</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Desenvolvido diretamente pelos engenheiros de segurança do Google. É totalmente interativo e ensina Linux, Python, redes, bancos de dados SQL e sistemas SIEM de forma super fluida e bem adaptada a iniciantes.
                      </p>
                      <div className="space-y-1.5 border-t border-white/5 pt-3">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Diferencial:</span>
                          <span className="text-amber-400 font-bold">Excelente currículo com possibilidade de auxílio financeiro</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Foco:</span>
                          <span className="text-zinc-300 font-sans italic">Preparação sólida para o mercado corporativo</span>
                        </div>
                      </div>
                    </div>
                    <a href="https://www.coursera.org/professional-certificates/google-cybersecurity" target="_blank" rel="noreferrer" className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                      Ver no Coursera <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                </div>
              </div>
            )}

            {/* Sub-tab 3: CHANNELS & LABS (Existing content preserved beautifully) */}
            {resourcesSubTab === 'links' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Channel 1 */}
                <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-3 flex flex-col justify-between hover:border-white/20 transition-all">
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono font-bold bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded w-max">
                      YouTube Br (Didático)
                    </div>
                    <h3 className="font-serif italic text-white text-base">Attekita Dev</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Conteúdo de tecnologia com explicações introdutórias sobre internet, desenvolvimento e carreira em TI.
                    </p>
                  </div>
                  <a href="https://www.youtube.com/@AttekitaDev" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                    Acessar canal oficial <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Channel 2 */}
                <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-3 flex flex-col justify-between hover:border-white/20 transition-all">
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono font-bold bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded w-max">
                      YouTube Br (Técnico)
                    </div>
                    <h3 className="font-serif italic text-white text-base">Hacking Club (CrowSec)</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Vídeos excelentes detalhando comandos de redes, ferramentas de varreduras como o Nmap, desenvolvimento em Python para segurança e configurações de servidores Linux.
                    </p>
                  </div>
                  <a href="https://www.youtube.com/@hackingclub_crowsec" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                    Acessar canal oficial <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Channel 3 */}
                <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-3 flex flex-col justify-between hover:border-white/20 transition-all">
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono font-bold bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded w-max">
                      YouTube Br (Comunidade)
                    </div>
                    <h3 className="font-serif italic text-white text-base">Guia Anônima</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Canal com conteúdo que vai do básico ao intermediário, com discussões semanais em formato de podcast sobre o mercado de trabalho, certificações e caminhos de estudo.
                    </p>
                  </div>
                  <a href="https://www.youtube.com/@guianonima" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                    Acessar canal oficial <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Channel 4 */}
                <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-3 flex flex-col justify-between hover:border-white/20 transition-all">
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono font-bold bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded w-max">
                      YouTube Br (Sistemas)
                    </div>
                    <h3 className="font-serif italic text-white text-base">Fábio Akita</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Vídeos excepcionalmente profundos explicando o funcionamento interno de computadores, redes, criptografia, compilers, arquitetura de computadores e sistemas operacionais de forma visceral.
                    </p>
                  </div>
                  <a href="https://www.youtube.com/@Akitando" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                    Acessar canal oficial <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Channel 5 (En) */}
                <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-3 flex flex-col justify-between hover:border-white/20 transition-all">
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded w-max">
                      YouTube En (Global Pro)
                    </div>
                    <h3 className="font-serif italic text-white text-base">John Hammond</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Uma das maiores lendas de segurança do YouTube global. John Hammond ensina engenharia reversa de vírus reais, resolução de desafios CTF (Capture the Flag) e análise de incidentes de ransomware.
                    </p>
                  </div>
                  <a href="https://www.youtube.com/@_JohnHammond" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                    Acessar canal oficial <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Platform 1 */}
                <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-3 flex flex-col justify-between hover:border-white/20 transition-all">
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded w-max">
                      Plataforma de Treino
                    </div>
                    <h3 className="font-serif italic text-white text-base">TryHackMe</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      A melhor plataforma para iniciantes absolutos. Ela possui salas virtuais guiadas com perguntas passo a passo para você atacar servidores e responder perguntas enquanto aprende.
                    </p>
                  </div>
                  <a href="https://tryhackme.com/" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                    Acessar TryHackMe <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Platform 2 */}
                <div className="p-5 rounded-xl border border-white/10 bg-[#0a0a0a] space-y-3 flex flex-col justify-between hover:border-white/20 transition-all">
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded w-max">
                      Plataforma de Treino
                    </div>
                    <h3 className="font-serif italic text-white text-base">Hack The Box</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Focada em desafios e máquinas um pouco mais complexas. Excelente passo após o TryHackMe para simular pentests de rede inteiros e testar sua criatividade hacker de verdade.
                    </p>
                  </div>
                  <a href="https://www.hackthebox.com/" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 pt-2 border-t border-white/5 mt-2 cursor-pointer">
                    Acessar Hack The Box <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            )}

          </div>
        )}

        {/* AI CHAT TAB */}
        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 animate-fade-in min-h-[500px]">
            
            {/* Quick Suggestions (Col 4) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="p-5 bg-[#0a0a0a] rounded-xl border border-white/10 space-y-3">
                <h3 className="font-serif italic text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Sugestões de Perguntas Rápidas
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Clique em um dos tópicos de dúvidas comuns abaixo para ver a explicação detalhada do Mentor Inteligente em tempo real:
                </p>

                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    onClick={() => handleSendMessage("Quais as melhores certificações de cibersegurança para iniciantes no Brasil?")}
                    disabled={isAiLoading}
                    className="text-left bg-[#050505] hover:bg-zinc-900 p-3 rounded border border-white/5 text-xs text-zinc-300 transition-all flex items-center justify-between gap-1 hover:border-emerald-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Certificações iniciais de mercado</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Explique detalhadamente como funciona um ataque de injeção de SQL e como Prepared Statements evitam isso.")}
                    disabled={isAiLoading}
                    className="text-left bg-[#050505] hover:bg-zinc-900 p-3 rounded border border-white/5 text-xs text-zinc-300 transition-all flex items-center justify-between gap-1 hover:border-emerald-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Como o SQL Injection funciona de verdade?</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  </button>
                  <button 
                    onClick={() => handleSendMessage("O que é o Kali Linux? Devo instalar ele como meu sistema operacional padrão para começar?")}
                    disabled={isAiLoading}
                    className="text-left bg-[#050505] hover:bg-zinc-900 p-3 rounded border border-white/5 text-xs text-zinc-300 transition-all flex items-center justify-between gap-1 hover:border-emerald-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Dúvidas sobre Kali Linux</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Pode me sugerir ideias para meu primeiro script de automação de segurança em Python?")}
                    disabled={isAiLoading}
                    className="text-left bg-[#050505] hover:bg-zinc-900 p-3 rounded border border-white/5 text-xs text-zinc-300 transition-all flex items-center justify-between gap-1 hover:border-emerald-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Ideias de Scripts Python Básicos</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs text-zinc-300 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Shield className="w-4 h-4" />
                  <span>Dica de Segurança Ética</span>
                </div>
                <p className="leading-relaxed">
                  Lembre-se: O conhecimento de exploits e varreduras deve ser usado estritamente em laboratórios de sua propriedade ou ambientes com autorização expressa em contrato. O hacker ético atua dentro das leis vigentes.
                </p>
              </div>
            </div>

            {/* AI Interactive Chat (Col 8) */}
            <div className="lg:col-span-8 p-6 bg-[#0a0a0a] rounded-xl border border-white/10 flex flex-col h-[500px]">
              
              <div className="border-b border-white/5 pb-3 mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="font-serif italic text-white text-sm">Mentor de Estudos IA (Online)</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Modelo: gemini-3.5-flash</span>
              </div>

              {/* Chat Output Container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <span className="text-[10px] text-zinc-500 font-mono mb-1">{msg.role === 'user' ? 'Você' : 'Mentor IA'} • {msg.time}</span>
                    <div 
                      className={`p-3 rounded-xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-emerald-400 text-black font-semibold rounded-tr-none' : 'bg-[#050505] text-zinc-100 rounded-tl-none border border-white/5 whitespace-pre-line'}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isAiLoading && (
                  <div className="flex flex-col items-start max-w-[80%]">
                    <span className="text-[10px] text-zinc-500 font-mono mb-1">Mentor IA está pensando...</span>
                    <div className="p-3 bg-[#050505] text-emerald-400 rounded-xl rounded-tl-none border border-white/5 flex items-center gap-2 text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Analisando base de segurança...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Container */}
              <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                <input 
                  type="text" 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  aria-label="Pergunta para o mentor de estudos"
                  maxLength={6000}
                  disabled={isAiLoading}
                  placeholder="Escreva sua pergunta (Ex: Como funciona criptografia assimétrica?)"
                  className="flex-1 bg-[#050505] border border-white/5 rounded-lg px-4 py-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={isAiLoading || !userInput.trim()}
                  className="bg-emerald-400 hover:bg-emerald-300 text-black font-bold px-5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar
                </button>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer copyright */}
      <footer className="border-t border-white/5 bg-[#050505] py-6 px-6 text-center text-xs text-zinc-500 flex flex-col sm:flex-row justify-between items-center max-w-7xl w-full mx-auto gap-4 mt-12 rounded-t-xl">
        <div>
          Jornada de Aprendizado de Programação e Cibersegurança Ética © 2026.
        </div>
        <div className="flex gap-4 font-mono text-[10px]">
          <span className="text-emerald-400/80">#STAY_SAFE</span>
          <span className="text-emerald-400/80">#ETHICAL_HACKER</span>
          <span className="text-emerald-400/80">#OWASP_TOP_10</span>
        </div>
      </footer>

    </div>
  );
}
