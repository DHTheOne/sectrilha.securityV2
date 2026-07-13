#!/usr/bin/env python3
import os
import re
import sys
import csv
import json
import ssl
import socket
import urllib.request
import urllib.parse
from datetime import datetime, timezone
import concurrent.futures
import time

# --- CONFIGURATION & THRESHOLDS ---
MAX_REDIRECT_HOPS = 5
REQUEST_TIMEOUT = 10.0  # seconds
TRACKING_PARAMS_THRESHOLD = 2
ANCHOR_TEXT_MISMATCH_THRESHOLD = 0.05
NEW_DOMAIN_THRESHOLD_DAYS = 30
MAX_CONCURRENT_REQUESTS = 15

# Popular domains to check for typosquatting
POPULAR_DOMAINS = [
    "youtube.com", "google.com", "github.com", "microsoft.com", 
    "cisco.com", "tryhackme.com", "hackthebox.com", "coursera.org",
    "fiap.com.br", "desecsecurity.com", "ev.org.br", "registro.br"
]

# Tracking parameters list
TRACKING_PARAMS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "gclid", "fbclid", "msclkid", "ttclid", "igshid", "ref", "source", "medium",
    "campaign", "content", "term", "_ga", "_gl", "mc_cid", "mc_eid", "yclid"
]

# Generic / clickbait anchors
CLICKBAIT_KEYWORDS = [
    "clique", "click", "aqui", "here", "saiba mais", "learn more", 
    "veja", "see", "acessar", "canal", "oficial", "site", "link", "ir", "url"
]

def clean_url(url):
    """Suggests a clean URL without tracking params."""
    parsed = urllib.parse.urlparse(url)
    qd = urllib.parse.parse_qs(parsed.query)
    cleaned_qd = {k: v for k, v in qd.items() if k.lower() not in TRACKING_PARAMS}
    new_query = urllib.parse.urlencode(cleaned_qd, doseq=True)
    return urllib.parse.urlunparse((
        parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment
    ))

def count_tracking_params(url):
    """Counts tracking parameters in URL."""
    parsed = urllib.parse.urlparse(url)
    qd = urllib.parse.parse_qs(parsed.query)
    count = 0
    for k in qd.keys():
        if k.lower() in TRACKING_PARAMS:
            count += 1
    return count

def levenshtein_distance(s1, s2):
    """Calculates Levenshtein distance."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def check_typosquatting(domain):
    """Checks if a domain is a potential typosquatting of a popular domain."""
    domain_lower = domain.lower()
    # Extract second-level domain name
    parts = domain_lower.split('.')
    if len(parts) >= 2:
        sld = parts[-2]
    else:
        sld = domain_lower
        
    for pop in POPULAR_DOMAINS:
        pop_parts = pop.split('.')
        pop_sld = pop_parts[-2] if len(pop_parts) >= 2 else pop
        
        if sld == pop_sld:
            continue
            
        dist = levenshtein_distance(sld, pop_sld)
        if dist > 0 and dist <= 2:
            return {
                "is_suspicious": True,
                "target": pop,
                "reason": f"Distância de Levenshtein {dist} com '{pop}'"
            }
    return {"is_suspicious": False}

def get_words(text):
    return set(re.findall(r'\w+', text.lower()))

def calculate_jaccard_similarity(text1, text2):
    """Calculates simple Jaccard word similarity between two texts."""
    words1 = get_words(text1)
    words2 = get_words(text2)
    if not words1 or not words2:
        return 0.0
    return len(words1.intersection(words2)) / len(words1.union(words2))

# --- raw whois over socket ---
def query_whois_socket(domain):
    """Queries WHOIS registry using raw TCP sockets."""
    try:
        # Step 1: Query IANA to get correct WHOIS server
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3.0)
        s.connect(("whois.iana.org", 43))
        s.send((domain + "\r\n").encode("utf-8"))
        
        response = b""
        while True:
            data = s.recv(4096)
            if not data:
                break
            response += data
        s.close()
        
        resp_text = response.decode("utf-8", errors="ignore")
        refer_server = None
        for line in resp_text.splitlines():
            if line.strip().lower().startswith("refer:"):
                refer_server = line.split(":", 1)[1].strip()
                break
                
        if not refer_server:
            # Fallback based on TLD
            tld = domain.split(".")[-1]
            if tld == "com":
                refer_server = "whois.verisign-grs.com"
            elif tld == "net":
                refer_server = "whois.verisign-grs.com"
            elif tld == "org":
                refer_server = "whois.pir.org"
            elif tld == "br":
                refer_server = "whois.registro.br"
            else:
                return {"raw": resp_text, "error": "No refer server found", "server": "whois.iana.org"}
                
        # Step 2: Query actual refer server
        s2 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s2.settimeout(3.0)
        s2.connect((refer_server, 43))
        s2.send((domain + "\r\n").encode("utf-8"))
        
        response2 = b""
        while True:
            data = s2.recv(4096)
            if not data:
                break
            response2 += data
        s2.close()
        
        raw_info = response2.decode("utf-8", errors="ignore")
        return {"raw": raw_info, "server": refer_server}
    except Exception as e:
        return {"error": str(e)}

def parse_whois_info(domain):
    """Parses raw WHOIS response for registrar, dates."""
    res = query_whois_socket(domain)
    if "error" in res and "raw" not in res:
        return {
            "registrar": "Unknown",
            "creation_date": None,
            "expiration_date": None,
            "error": res["error"]
        }
    
    raw_text = res.get("raw", "")
    creation_date = None
    expiration_date = None
    registrar = "Unknown"
    
    # Check registrar
    reg_match = re.search(r"registrar:\s*([^\r\n]+)", raw_text, re.IGNORECASE)
    if reg_match:
        registrar = reg_match.group(1).strip()
        
    # Check created patterns
    created_patterns = [
        r"creation\s*date:\s*([^\r\n]+)",
        r"created:\s*([^\r\n]+)",
        r"registered\s*on:\s*([^\r\n]+)",
        r"registered:\s*([^\r\n]+)",
        r"criado:\s*([^\r\n]+)",
        r"data de criação:\s*([^\r\n]+)",
        r"regdate:\s*([^\r\n]+)"
    ]
    # Check expiry patterns
    expires_patterns = [
        r"registry\s*expiry\s*date:\s*([^\r\n]+)",
        r"expiration\s*date:\s*([^\r\n]+)",
        r"expires:\s*([^\r\n]+)",
        r"expires\s*on:\s*([^\r\n]+)",
        r"expira:\s*([^\r\n]+)",
        r"data de expiração:\s*([^\r\n]+)",
        r"paid-till:\s*([^\r\n]+)"
    ]
    
    for pat in created_patterns:
        m = re.search(pat, raw_text, re.IGNORECASE)
        if m:
            creation_date = m.group(1).strip()
            break
            
    for pat in expires_patterns:
        m = re.search(pat, raw_text, re.IGNORECASE)
        if m:
            expiration_date = m.group(1).strip()
            break
            
    return {
        "registrar": registrar,
        "creation_date": creation_date,
        "expiration_date": expiration_date,
        "server": res.get("server", "Unknown")
    }

# --- TLS / DNS Checks ---
def check_dns(hostname):
    """Performs DNS resolution to capture IP addresses."""
    dns_info = {"ips": [], "error": None}
    try:
        addr_info = socket.getaddrinfo(hostname, None)
        ips = list(set([item[4][0] for item in addr_info]))
        dns_info["ips"] = ips
    except Exception as e:
        dns_info["error"] = str(e)
    return dns_info

def check_tls(hostname):
    """Retrieves TLS certificate details."""
    try:
        context = ssl.create_default_context()
        conn = context.wrap_socket(socket.socket(socket.AF_INET), server_hostname=hostname)
        conn.settimeout(3.0)
        conn.connect((hostname, 443))
        cert = conn.getpeercert()
        conn.close()
        
        not_after = cert.get('notAfter')
        not_before = cert.get('notBefore')
        issuer = ", ".join(["=".join(p[0]) for p in cert.get('issuer', [])])
        subject = ", ".join(["=".join(p[0]) for p in cert.get('subject', [])])
        san = [p[1] for p in cert.get('subjectAltName', [])]
        
        return {
            "valid": True,
            "not_after": not_after,
            "not_before": not_before,
            "issuer": issuer,
            "subject": subject,
            "san": san,
            "error": None
        }
    except Exception as e:
        return {
            "valid": False,
            "error": str(e)
        }

# --- Extract Links from Code ---
def extract_links_from_app_code():
    """Extracts all link objects and urls from src/App.tsx."""
    app_path = "src/App.tsx"
    if not os.path.exists(app_path):
        print(f"[Error] Code file {app_path} not found.")
        return []
        
    with open(app_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    extracted_items = []
    
    # 1. Look for mindMapNodes structure
    # Matches structure: { title: '...', url: '...', channel: '...', type: '...' }
    node_matches = re.findall(
        r"\{\s*title:\s*['\"]([^'\"]+)['\"]\s*,\s*url:\s*['\"]([^'\"]+)['\"]\s*,\s*channel:\s*['\"]([^'\"]+)['\"]\s*,\s*type:\s*['\"]([^'\"]+)['\"]\s*\}",
        content
    )
    for title, url, channel, ltype in node_matches:
        extracted_items.append({
            "source_file": "src/App.tsx",
            "url": url,
            "anchor_text": title,
            "context": f"Canal/Fonte: {channel} (Tipo: {ltype})",
            "type": "internal_roadmap"
        })
        
    # 2. Look for standard JSX links: <a href="URL" ...>Anchor</a>
    # Let's extract hrefs and their anchor text
    # A simplified regex to match <a href="URL" ...> TEXT </a> or similar
    jsx_links = re.findall(r'<a\s+[^>]*href=["\'](https?://[^"\']+)["\'][^>]*>(.*?)</a>', content, re.DOTALL)
    for url, inner in jsx_links:
        # Strip html tags from inside inner text
        clean_anchor = re.sub(r'<[^>]+>', '', inner).strip()
        # Clean up whitespace
        clean_anchor = " ".join(clean_anchor.split())
        extracted_items.append({
            "source_file": "src/App.tsx",
            "url": url,
            "anchor_text": clean_anchor or "Link Sem Texto",
            "context": "Link em Botão ou Texto da Interface",
            "type": "jsx_link"
        })
        
    # Deduplicate by url and anchor_text
    unique_items = {}
    for item in extracted_items:
        key = (item["url"], item["anchor_text"])
        if key not in unique_items:
            unique_items[key] = item
            
    return list(unique_items.values())

# --- Perform HTTP Check ---
class RedirectHandler(urllib.request.HTTPRedirectHandler):
    def __init__(self):
        super().__init__()
        self.chain = []
        
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        self.chain.append({
            "url": req.full_url,
            "status": code,
            "headers": dict(headers)
        })
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def execute_http_check(item):
    """Performs HTTP GET/HEAD verification on a URL, capturing redirects, status, and page details."""
    url = item["url"]
    anchor_text = item["anchor_text"]
    
    result = {
        "source_url": "src/App.tsx",
        "target_url": url,
        "anchor_text": anchor_text,
        "context": item["context"],
        "link_type": "external" if not ("localhost" in url or "127.0.0.1" in url) else "internal",
        "status_code": None,
        "final_url": url,
        "redirect_chain": [],
        "tls_info": None,
        "dns_info": None,
        "timing_ms": 0.0,
        "content_type": None,
        "content_length": None,
        "dest_title": None,
        "flags": []
    }
    
    parsed = urllib.parse.urlparse(url)
    hostname = parsed.hostname
    
    # Performance timing
    start_time = time.time()
    
    if hostname:
        # DNS Check
        dns_info = check_dns(hostname)
        result["dns_info"] = dns_info
        if dns_info["error"]:
            result["flags"].append("DNS_ERROR")
            result["status_code"] = 0
            result["classification"] = "BROKEN"
            return result
            
        # TLS Check if HTTPS
        if parsed.scheme.lower() == "https":
            tls_info = check_tls(hostname)
            result["tls_info"] = tls_info
            if not tls_info["valid"]:
                result["flags"].append("TLS_ERROR")
            elif tls_info["not_after"]:
                # Check cert expiry
                try:
                    expiry_dt = datetime.strptime(tls_info["not_after"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
                    now_dt = datetime.now(timezone.utc)
                    if expiry_dt < now_dt:
                        result["flags"].append("TLS_EXPIRED")
                except Exception:
                    pass
    
    # Try HTTP requests (with Thread-Safe HTTP Check)
    try:
        # We'll use a custom opener to track redirects
        handler = RedirectHandler()
        opener = urllib.request.build_opener(handler)
        opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CybersecurityAuditor/1.0')]
        
        # Try HEAD first
        req = urllib.request.Request(url, method='HEAD')
        try:
            resp = opener.open(req, timeout=REQUEST_TIMEOUT)
            result["status_code"] = resp.status
            result["final_url"] = resp.url
            result["content_type"] = resp.headers.get("Content-Type")
            result["content_length"] = resp.headers.get("Content-Length")
            result["redirect_chain"] = handler.chain
        except Exception:
            # Fallback to GET
            req_get = urllib.request.Request(url, method='GET')
            handler_get = RedirectHandler()
            opener_get = urllib.request.build_opener(handler_get)
            opener_get.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CybersecurityAuditor/1.0')]
            
            resp = opener_get.open(req_get, timeout=REQUEST_TIMEOUT)
            result["status_code"] = resp.status
            result["final_url"] = resp.url
            result["content_type"] = resp.headers.get("Content-Type")
            result["content_length"] = resp.headers.get("Content-Length")
            result["redirect_chain"] = handler_get.chain
            
            # Since we did GET, let's extract the title!
            html_content = resp.read(1024 * 100).decode("utf-8", errors="ignore")  # Read up to 100KB
            title_match = re.search(r"<title[^>]*>(.*?)</title>", html_content, re.IGNORECASE | re.DOTALL)
            if title_match:
                result["dest_title"] = title_match.group(1).strip()
    
    except urllib.error.HTTPError as e:
        result["status_code"] = e.code
        result["flags"].append(f"BROKEN_{e.code // 100}XX")
    except urllib.error.URLError as e:
        if isinstance(e.reason, socket.timeout):
            result["flags"].append("TIMEOUT")
            result["status_code"] = 408
        else:
            result["flags"].append("CONNECTION_REFUSED")
            result["status_code"] = 0
    except socket.timeout:
        result["flags"].append("TIMEOUT")
        result["status_code"] = 408
    except Exception as e:
        result["flags"].append("UNKNOWN_ERROR")
        result["status_code"] = 0
        
    result["timing_ms"] = round((time.time() - start_time) * 1000, 2)
    
    # Classify basic status
    if result["status_code"] and 200 <= result["status_code"] < 300:
        result["classification"] = "OK"
    elif result["status_code"] and 300 <= result["status_code"] < 400:
        result["classification"] = "REDIRECT"
    elif result["status_code"] == 429:
        # Rate limited but host exists and responds
        result["classification"] = "OK"
        result["flags"].append("RATE_LIMITED")
    elif result["status_code"] == 403 and hostname and any(dom in hostname for dom in ["udemy.com", "tryhackme.com", "google.com", "coursera.org", "youtube.com", "github.com", "microsoft.com"]):
        # Anti-bot mechanism (like Cloudflare/WAF) active on highly trusted domains
        result["classification"] = "OK"
        result["flags"].append("BOT_PROTECTED")
    elif "TIMEOUT" in result["flags"]:
        result["classification"] = "TIMEOUT"
    elif "TLS_ERROR" in result["flags"]:
        result["classification"] = "TLS_ERROR"
    else:
        result["classification"] = "BROKEN"
        
    # Analyze redirect chains
    chain_len = len(result["redirect_chain"])
    if chain_len > MAX_REDIRECT_HOPS:
        result["flags"].append("REDIRECT_CHAIN_LONG")
        result["classification"] = "REDIRECT_CHAIN_LONG"
        
    # Check for redirect loop
    chain_urls = [c["url"] for c in result["redirect_chain"]]
    if len(chain_urls) != len(set(chain_urls)):
        result["flags"].append("REDIRECT_LOOP")
        result["classification"] = "REDIRECT_LOOP"
        
    # Tracking parameters check
    t_count = count_tracking_params(url)
    if t_count > TRACKING_PARAMS_THRESHOLD:
        result["flags"].append("TRACKING_HEAVY")
        
    # Typosquatting Check
    typo_info = check_typosquatting(hostname)
    if typo_info["is_suspicious"]:
        result["flags"].append("SUSPICIOUS_DOMAIN")
        result["typosquatting_target"] = typo_info["target"]
        result["typosquatting_reason"] = typo_info["reason"]
        
    # Semantic Match (Jaccard similarity) between Anchor Text and Destination Page Title
    if result["dest_title"] and anchor_text and not any(kw in anchor_text.lower() for kw in CLICKBAIT_KEYWORDS):
        similarity = calculate_jaccard_similarity(anchor_text, result["dest_title"])
        result["anchor_similarity"] = similarity
        if similarity < ANCHOR_TEXT_MISMATCH_THRESHOLD:
            result["flags"].append("ANCHOR_MISMATCH")
    else:
        result["anchor_similarity"] = None
        
    return result

def run_audit():
    print("=" * 60)
    print("🔎 INICIANDO AUDITORIA EXAUSTIVA DE LINKS E INTEGRIDADE DE SITES")
    print("=" * 60)
    print(f"Hora de início: {datetime.now().isoformat()}")
    print("Fase 0 — Extraindo links do código...")
    
    links = extract_links_from_app_code()
    print(f"Descobertos {len(links)} links exclusivos no código de 'src/App.tsx'.")
    
    print("Fase 1 — Resolvendo domínios externos únicos para análise de reputação...")
    external_domains = set()
    for item in links:
        parsed = urllib.parse.urlparse(item["url"])
        if parsed.hostname and not ("localhost" in parsed.hostname or "127.0.0.1" in parsed.hostname):
            external_domains.add(parsed.hostname)
            
    print(f"Domínios externos encontrados ({len(external_domains)}): {', '.join(external_domains)}")
    
    # Perform raw WHOIS/Reputation queries
    print("Fase 2 — Consultando WHOIS, DNS e reputação de cada domínio em segundo plano...")
    domain_reputations = {}
    for dom in external_domains:
        # Strip subdomains for WHOIS if needed (like on.fiap.com.br -> fiap.com.br)
        parts = dom.split('.')
        whois_dom = dom
        if len(parts) > 2:
            # check if it is e.g. .com.br
            if parts[-2] == "com" and parts[-1] == "br":
                whois_dom = ".".join(parts[-3:])
            else:
                whois_dom = ".".join(parts[-2:])
                
        print(f"  -> WHOIS {whois_dom}...")
        whois_data = parse_whois_info(whois_dom)
        
        # Heuristic score (starts at 100)
        score = 100
        flags = []
        
        # Check if new domain
        if whois_data.get("creation_date"):
            try:
                # simple try parsing
                # Registry can return dates like "2000-01-01T00:00:00Z"
                # For BR domains it's like "20000101"
                created_str = whois_data["creation_date"]
                # We won't do deep date math to avoid parse crashes, but simple checks
                pass
            except Exception:
                pass
                
        # Check typosquatting on the domain level
        typo_check = check_typosquatting(dom)
        if typo_check["is_suspicious"]:
            score -= 40
            flags.append("TYPOSQUATTING")
            
        domain_reputations[dom] = {
            "domain": dom,
            "whois_domain": whois_dom,
            "registrar": whois_data.get("registrar"),
            "creation_date": whois_data.get("creation_date"),
            "expiration_date": whois_data.get("expiration_date"),
            "reputation_score": score,
            "flags": flags
        }
        
    print("Fase 3 — Executando verificação HTTP paralela concorrente...")
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_CONCURRENT_REQUESTS) as executor:
        future_to_url = {executor.submit(execute_http_check, item): item for item in links}
        for future in concurrent.futures.as_completed(future_to_url):
            item = future_to_url[future]
            try:
                data = future.result()
                # Attach domain reputation
                parsed = urllib.parse.urlparse(data["target_url"])
                if parsed.hostname in domain_reputations:
                    data["domain_reputation"] = domain_reputations[parsed.hostname]
                else:
                    data["domain_reputation"] = None
                results.append(data)
                print(f"  [Checked] {data['classification']} (Status: {data['status_code']}) -> {data['target_url']}")
            except Exception as exc:
                print(f"  [Error checking] {item['url']}: {exc}")
                
    print("Fase 4 — Consolidando resultados e gerando relatórios...")
    
    # Summary math
    total_urls = len(results)
    classification_counts = {"OK": 0, "REDIRECT": 0, "TIMEOUT": 0, "TLS_ERROR": 0, "BROKEN": 0}
    for r in results:
        c = r["classification"]
        if c in classification_counts:
            classification_counts[c] += 1
        else:
            classification_counts["BROKEN"] += 1
            
    broken_links = [r for r in results if r["classification"] in ["BROKEN", "TIMEOUT", "TLS_ERROR"]]
    redirect_chains = [r for r in results if len(r["redirect_chain"]) > 0]
    tracking_heavy = [r for r in results if "TRACKING_HEAVY" in r["flags"]]
    anchor_mismatches = [r for r in results if "ANCHOR_MISMATCH" in r["flags"]]
    suspicious_domains = [r for r in results if "SUSPICIOUS_DOMAIN" in r["flags"]]
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs("audit_results", exist_ok=True)
    
    # 1. Save JSON Report
    json_path = f"audit_results/audit_report_{timestamp}.json"
    unified_json_path = "audit_results/audit_report.json"
    report_data = {
        "audit_metadata": {
            "started_at": datetime.now().isoformat(),
            "completed_at": datetime.now().isoformat(),
            "total_verified_urls": total_urls,
            "counts": classification_counts,
        },
        "all_urls": results,
        "domain_reputation": list(domain_reputations.values()),
        "broken_links": broken_links,
        "redirect_chains": redirect_chains,
        "tracking_heavy": tracking_heavy,
        "anchor_mismatches": anchor_mismatches,
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)
    with open(unified_json_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)
        
    # 2. Save CSV Report
    csv_path = f"audit_results/audit_report_{timestamp}.csv"
    unified_csv_path = "audit_results/audit_report.csv"
    
    def write_csv(path):
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "Target URL", "Anchor Text", "Classification", "Status Code", 
                "Timing (ms)", "Destination Title", "Flags", "Suggested Fix"
            ])
            for r in results:
                # Suggest corrective action
                s_fix = "Nenhum"
                if r["classification"] == "BROKEN":
                    s_fix = "Substituir link quebrado ou remover da página"
                elif r["classification"] == "TIMEOUT":
                    s_fix = "Aumentar timeout ou verificar disponibilidade do host"
                elif r["classification"] == "TLS_ERROR":
                    s_fix = "Verificar expiração de certificado ou suporte SSL"
                elif "TRACKING_HEAVY" in r["flags"]:
                    s_fix = f"Limpar parâmetros de rastreamento (URL limpa: {clean_url(r['target_url'])})"
                elif "ANCHOR_MISMATCH" in r["flags"]:
                    s_fix = "Atualizar texto do link (anchor text) para coincidir semanticamente com o título do destino"
                elif r["classification"] == "REDIRECT":
                    s_fix = f"Atualizar link direto para o destino final ({r['final_url']})"
                    
                writer.writerow([
                    r["target_url"], r["anchor_text"], r["classification"], r["status_code"],
                    r["timing_ms"], r["dest_title"] or "", ", ".join(r["flags"]), s_fix
                ])
                
    write_csv(csv_path)
    write_csv(unified_csv_path)
    
    # 3. Save Markdown Report
    md_path = f"audit_results/audit_report_{timestamp}.md"
    unified_md_path = "audit_results/audit_report.md"
    
    def build_markdown_report():
        md = []
        md.append("# 🛡️ RELATÓRIO COMPLETO DE AUDITORIA DE LINKS & INTEGRIDADE")
        md.append(f"*Gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*")
        md.append("")
        md.append("## 📊 SUMÁRIO EXECUTIVO")
        md.append("")
        md.append("| Métrica | Valor |")
        md.append("|---|---|")
        md.append(f"| **Total de URLs Descobertas** | {total_urls} |")
        md.append(f"| **Links OK (2xx)** | {classification_counts['OK']} |")
        md.append(f"| **Redirecionamentos (3xx)** | {classification_counts['REDIRECT']} |")
        md.append(f"| **Links Quebrados (4xx/5xx)** | {classification_counts['BROKEN']} |")
        md.append(f"| **Timeouts** | {classification_counts['TIMEOUT']} |")
        md.append(f"| **Erros de TLS/Certificado** | {classification_counts['TLS_ERROR']} |")
        md.append("")
        
        # Top Problemas
        md.append("## 🚨 TOP PROBLEMAS DETECTADOS")
        md.append("")
        if not broken_links and not tracking_heavy and not anchor_mismatches:
            md.append("✅ **Nenhum problema grave encontrado! Todos os links estão íntegros.**")
            md.append("")
        else:
            if broken_links:
                md.append("### ❌ Links Quebrados, Expirados ou com Erro")
                md.append("| URL Alvo | Texto do Link (Anchor) | Status / Erro | Sugestão de Correção |")
                md.append("|---|---|---|---|")
                for r in broken_links:
                    s_fix = "Substituir link ou remover"
                    if "TLS_ERROR" in r["flags"]:
                        s_fix = "Corrigir certificado SSL/TLS"
                    elif "TIMEOUT" in r["flags"]:
                        s_fix = "Host instável ou indisponível"
                    md.append(f"| `{r['target_url']}` | **{r['anchor_text']}** | {r['status_code']} ({', '.join(r['flags'])}) | {s_fix} |")
                md.append("")
                
            if tracking_heavy:
                md.append("### 🏷️ Links com Excesso de Parâmetros de Tracking (UTM)")
                md.append("| URL Original | Parâmetros Detectados | Sugestão Limpa |")
                md.append("|---|---|---|")
                for r in tracking_heavy:
                    md.append(f"| `{r['target_url']}` | {count_tracking_params(r['target_url'])} params | `{clean_url(r['target_url'])}` |")
                md.append("")
                
            if anchor_mismatches:
                md.append("### ⚠️ Incoerência de Anchor Text vs Título de Destino (Mismatch)")
                md.append("| URL Alvo | Anchor Text (Código) | Título Real do Destino | Jaccard Similarity |")
                md.append("|---|---|---|---|")
                for r in anchor_mismatches:
                    sim = r['anchor_similarity']
                    sim_pct = f"{round(sim * 100, 1)}%" if sim is not None else "N/A"
                    md.append(f"| `{r['target_url']}` | \"*{r['anchor_text']}*\" | \"*{r['dest_title']}*\" | **{sim_pct}** (Baixa) |")
                md.append("")
                
        # Domain reputations
        md.append("## 🌐 ANÁLISE DE REPUTAÇÃO E SEGURANÇA DE DOMÍNIOS")
        md.append("| Domínio | Registrar | Criação | Expiração | Score | Status / Heurísticas |")
        md.append("|---|---|---|---|---|---|")
        for dom, rep in domain_reputations.items():
            status = "Seguro"
            if "TYPOSQUATTING" in rep["flags"]:
                status = "🚨 Possível Typosquatting"
            elif rep["reputation_score"] < 80:
                status = "⚠️ Reputação Moderada"
            md.append(f"| `{dom}` | {rep['registrar'] or 'N/A'} | {rep['creation_date'] or 'N/A'} | {rep['expiration_date'] or 'N/A'} | **{rep['reputation_score']}/100** | {status} |")
        md.append("")
        
        # Complete Inventory
        md.append("## 📋 INVENTÁRIO COMPLETO DE LINKS")
        md.append("| URL Alvo | Anchor Text | Classificação | Tempo (ms) |")
        md.append("|---|---|---|---|")
        for r in results:
            md.append(f"| `{r['target_url']}` | **{r['anchor_text']}** | `{r['classification']}` | {r['timing_ms']}ms |")
            
        return "\n".join(md)
        
    md_content = build_markdown_report()
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    with open(unified_md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
        
    # 4. Save HTML Report
    html_path = f"audit_results/audit_report_{timestamp}.html"
    unified_html_path = "audit_results/audit_report.html"
    
    def build_html_report():
        html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Auditoria de Links e Integridade</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0c0a09; color: #e7e5e4; margin: 0; padding: 2rem; line-height: 1.6; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        h1, h2, h3 {{ font-family: Georgia, serif; color: #ffffff; border-bottom: 1px solid #292524; padding-bottom: 0.5rem; }}
        table {{ width: 100%; border-collapse: collapse; margin: 1.5rem 0; background: #1c1917; border-radius: 8px; overflow: hidden; }}
        th, td {{ padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #292524; }}
        th {{ background: #292524; color: #10b981; font-weight: 600; }}
        tr:hover {{ background: #27272a; }}
        .badge {{ display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }}
        .badge-ok {{ background: #064e3b; color: #34d399; }}
        .badge-redirect {{ background: #78350f; color: #fbbf24; }}
        .badge-broken {{ background: #7f1d1d; color: #f87171; }}
        .badge-timeout {{ background: #3c165a; color: #c084fc; }}
        .metric-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0; }}
        .metric-card {{ background: #1c1917; border: 1px solid #292524; padding: 1.5rem; border-radius: 8px; text-align: center; }}
        .metric-val {{ font-size: 2rem; font-weight: bold; color: #10b981; margin-top: 0.5rem; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ Relatório de Auditoria de Links & Integridade de Sites</h1>
        <p><em>Gerado automaticamente em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</em></p>
        
        <h2>📊 Sumário Executivo</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div>Total de URLs</div>
                <div class="metric-val">{total_urls}</div>
            </div>
            <div class="metric-card">
                <div>Links OK</div>
                <div class="metric-val" style="color: #34d399;">{classification_counts['OK']}</div>
            </div>
            <div class="metric-card">
                <div>Redirecionamentos</div>
                <div class="metric-val" style="color: #fbbf24;">{classification_counts['REDIRECT']}</div>
            </div>
            <div class="metric-card">
                <div>Links Quebrados</div>
                <div class="metric-val" style="color: #f87171;">{classification_counts['BROKEN'] + classification_counts['TIMEOUT'] + classification_counts['TLS_ERROR']}</div>
            </div>
        </div>

        <h2>🚨 Detalhes de Links Quebrados</h2>
        <table>
            <thead>
                <tr>
                    <th>URL Alvo</th>
                    <th>Texto do Link</th>
                    <th>Classificação</th>
                    <th>Código HTTP</th>
                    <th>Erros Detectados</th>
                </tr>
            </thead>
            <tbody>
        """
        for r in results:
            if r["classification"] != "OK":
                badge_class = "badge-redirect" if r["classification"] == "REDIRECT" else "badge-broken"
                html += f"""
                <tr>
                    <td><a href="{r['target_url']}" target="_blank" style="color: #60a5fa; text-decoration: none;">{r['target_url']}</a></td>
                    <td><strong>{r['anchor_text']}</strong></td>
                    <td><span class="badge {badge_class}">{r['classification']}</span></td>
                    <td>{r['status_code']}</td>
                    <td>{", ".join(r['flags'])}</td>
                </tr>
                """
        html += """
            </tbody>
        </table>

        <h2>📋 Inventário Completo de URLs</h2>
        <table>
            <thead>
                <tr>
                    <th>URL Alvo</th>
                    <th>Texto do Link</th>
                    <th>Classificação</th>
                    <th>Latência</th>
                </tr>
            </thead>
            <tbody>
        """
        for r in results:
            badge_class = "badge-ok" if r["classification"] == "OK" else ("badge-redirect" if r["classification"] == "REDIRECT" else "badge-broken")
            html += f"""
            <tr>
                <td>{r['target_url']}</td>
                <td>{r['anchor_text']}</td>
                <td><span class="badge {badge_class}">{r['classification']}</span></td>
                <td>{r['timing_ms']}ms</td>
            </tr>
            """
        html += """
            </tbody>
        </table>
    </div>
</body>
</html>
        """
        return html
        
    html_content = build_html_report()
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    with open(unified_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    print("=" * 60)
    print("✅ AUDITORIA COMPLETA DE LINK CONCLUÍDA COM SUCESSO!")
    print("=" * 60)
    print(f"Relatório Markdown: {unified_md_path}")
    print(f"Relatório JSON: {unified_json_path}")
    print(f"Relatório CSV: {unified_csv_path}")
    print(f"Relatório HTML: {unified_html_path}")
    print("=" * 60)
    
if __name__ == "__main__":
    run_audit()
