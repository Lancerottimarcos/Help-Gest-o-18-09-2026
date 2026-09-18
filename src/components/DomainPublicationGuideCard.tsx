import React, { useState } from 'react';
import {
  Globe,
  Server,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Terminal,
  Lock,
  ExternalLink,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
  HelpCircle,
  FileCode
} from 'lucide-react';
import { generateSystemBackup, downloadBackupJsonFile } from '../utils/backupManager';
import { SecurityConfig } from '../utils/securityProtocols';

interface DomainPublicationGuideCardProps {
  config: SecurityConfig;
}

export const DomainPublicationGuideCard: React.FC<DomainPublicationGuideCardProps> = ({ config }) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'dns' | 'ssl' | 'nginx' | 'backup'>('checklist');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  const nginxConfigCode = `# ==============================================================================
# Help Ideias Digitais - Configuração Nginx de Alta Segurança para Produção
# Arquivo: /etc/nginx/sites-available/help-ideias-digitais.conf
# ==============================================================================

# 1. Redirecionamento Forçado HTTP (Porta 80) para HTTPS (Porta 443)
server {
    listen 80;
    listen [::]:80;
    server_name helpideiasdigitais.com.br app.helpideiasdigitais.com.br;

    # Bloqueia tráfego inseguro e força HTTPS imediato
    return 301 https://$host$request_uri;
}

# 2. Servidor Principal com Criptografia SSL/TLS e Proteção Anti-Intrusão
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name helpideiasdigitais.com.br app.helpideiasdigitais.com.br;

    # Diretório dos arquivos compilados (Vite / React dist)
    root /var/www/help-ideias-digitais/dist;
    index index.html;

    # Certificados SSL/TLS (Gerados via Certbot / Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/helpideiasdigitais.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/helpideiasdigitais.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Cabeçalhos Rígidos de Cibersegurança (Anti-Spoofing, Clickjacking e XSS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Roteamento de Aplicação SPA (Single Page Application)
    # Redireciona todas as rotas internas para o index.html sem quebrar recarregamentos
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache Otimizado para Arquivos Estáticos e Imagens
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Bloqueio de Acesso a Arquivos Sensíveis (.env, .git, .htaccess)
    location ~ /\.(?!well-known).* {
        deny all;
        access_log off;
        log_not_found off;
    }
}`;

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleDownloadBackup = () => {
    setIsExportingBackup(true);
    setTimeout(() => {
      try {
        const backup = generateSystemBackup('lancerottirmarcos@gmail.com');
        downloadBackupJsonFile(backup);
        setBackupSuccess(true);
        setTimeout(() => setBackupSuccess(false), 4000);
      } finally {
        setIsExportingBackup(false);
      }
    }, 400);
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
            <Globe size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-[#142142] dark:text-white">
                Guia de Publicação no Domínio Próprio & Checklist de Cibersegurança
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black uppercase">
                Pronto para Publicar
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instruções completas para configurar DNS, certificado SSL/TLS gratuito, servidor web (Nginx) e backup seguro pré-lançamento.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadBackup}
          disabled={isExportingBackup}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#142142] dark:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-xs"
          title="Exportar cópia de segurança completa do banco de dados antes da publicação"
        >
          <Download size={14} className="text-[#fab518]" />
          <span>{isExportingBackup ? 'Gerando Backup...' : 'Backup Pré-Lançamento (JSON)'}</span>
        </button>
      </div>

      {backupSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>Backup completo gerado e salvo com sucesso no seu dispositivo! Dados prontos para o domínio próprio.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('checklist')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'checklist'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142]'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck size={14} />
          <span>1. Checklist Anti-Invasão</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dns')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'dns'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142]'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe size={14} />
          <span>2. Apontamentos DNS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ssl')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'ssl'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142]'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock size={14} />
          <span>3. Certificado SSL/TLS (HTTPS)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('nginx')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'nginx'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142]'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCode size={14} />
          <span>4. Configuração Nginx (Pronta)</span>
        </button>
      </div>

      {/* TAB 1: Security Checklist */}
      {activeTab === 'checklist' && (
        <div className="space-y-4 animate-in fade-in">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            O sistema passou pela auditoria e todos os 8 módulos de segurança cibernética estão implementados e operando ativamente:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="text-xs">
                <p className="font-black text-[#142142] dark:text-white">Escudo Antivírus & Inspeção de Cabeçalhos</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Analisa magic bytes binários nos uploads para bloquear executáveis MZ/PE ou ELF camuflados.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="text-xs">
                <p className="font-black text-[#142142] dark:text-white">Defesa Anti-Força Bruta no Login</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Bloqueia IP/terminal após {config.maxLoginAttempts} tentativas incorretas por {config.lockoutDurationMinutes} minutos.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="text-xs">
                <p className="font-black text-[#142142] dark:text-white">Firewall WAF Anti-SQL Injection e XSS</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Sanitiza formulários de demandas, briefings e clientes contra scripts maliciosos.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="text-xs">
                <p className="font-black text-[#142142] dark:text-white">Criptografia SHA-256 com Salting</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Senhas nunca trafegam ou são gravadas em texto puro, validadas por hash unidirecional.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="text-xs">
                <p className="font-black text-[#142142] dark:text-white">Autenticação em Dois Fatores (2FA)</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Exige código temporário de 6 dígitos em operações sensíveis como alteração de senhas e dados globais.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="text-xs">
                <p className="font-black text-[#142142] dark:text-white">Encerramento Automático de Sessão</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Suspende o posto de trabalho após {config.sessionTimeoutMinutes} minutos de inatividade para evitar acesso local não autorizado.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="text-xs">
                <p className="font-black text-[#142142] dark:text-white">Isolamento do Portal do Cliente</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Links de aprovação acessam exclusivamente a demanda designada, sem visão das finanças ou painel interno.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="text-xs">
                <p className="font-black text-[#142142] dark:text-white">HTTPS Obrigatório & HSTS Ativo</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Instrui navegadores a manter conexão TLS 1.3 por 1 ano contra ataques man-in-the-middle.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DNS Records */}
      {activeTab === 'dns' && (
        <div className="space-y-4 animate-in fade-in text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            No painel da sua empresa registradora de domínio (Registro.br, Cloudflare, GoDaddy, Hostinger, etc.), adicione os seguintes apontamentos:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 uppercase font-bold">
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Nome / Host</th>
                  <th className="py-2.5 px-3">Destino / Valor</th>
                  <th className="py-2.5 px-3">TTL</th>
                  <th className="py-2.5 px-3">Finalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <tr>
                  <td className="py-3 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">A</td>
                  <td className="py-3 px-3 font-mono">@ (ou raiz)</td>
                  <td className="py-3 px-3 font-mono text-[#fab518] font-bold">IP_DO_SEU_SERVIDOR</td>
                  <td className="py-3 px-3 text-slate-400">Automático (3600)</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">Acesso via seudominio.com.br</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">CNAME</td>
                  <td className="py-3 px-3 font-mono">app</td>
                  <td className="py-3 px-3 font-mono text-[#fab518] font-bold">seudominio.com.br.</td>
                  <td className="py-3 px-3 text-slate-400">Automático (3600)</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">Acesso via app.seudominio.com.br</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">CNAME</td>
                  <td className="py-3 px-3 font-mono">www</td>
                  <td className="py-3 px-3 font-mono text-[#fab518] font-bold">seudominio.com.br.</td>
                  <td className="py-3 px-3 text-slate-400">Automático (3600)</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">Redirecionamento amigável</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 text-xs flex items-center gap-2.5">
            <Sparkles size={16} className="text-cyan-600 shrink-0" />
            <p>
              <strong>Dica de Performance:</strong> Utilizando o <strong>Cloudflare</strong> com proxy ativado (nuvem laranja), você ganha proteção DDoS corporativa gratuita e SSL automático em menos de 2 minutos.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: SSL/TLS Let's Encrypt */}
      {activeTab === 'ssl' && (
        <div className="space-y-4 animate-in fade-in text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Para emitir o certificado criptográfico gratuito e com renovação 100% automática no seu servidor Linux (Ubuntu/Debian), execute os seguintes comandos no terminal:
          </p>

          <div className="bg-[#0a1224] text-slate-200 rounded-2xl p-4 font-mono text-[11px] space-y-2 relative border border-slate-800">
            <button
              type="button"
              onClick={() => handleCopyCode('sudo apt update && sudo apt install certbot python3-certbot-nginx -y\nsudo certbot --nginx -d helpideiasdigitais.com.br -d app.helpideiasdigitais.com.br', 'certbot')}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-1 text-[10px]"
            >
              {copiedCode === 'certbot' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedCode === 'certbot' ? 'Copiado!' : 'Copiar Comandos'}</span>
            </button>

            <p className="text-slate-400"># 1. Instalar o utilitário oficial do Let's Encrypt</p>
            <p className="text-emerald-400">sudo apt update && sudo apt install certbot python3-certbot-nginx -y</p>
            <p className="text-slate-400 pt-2"># 2. Emitir o certificado e configurar o Nginx automaticamente</p>
            <p className="text-emerald-400">sudo certbot --nginx -d helpideiasdigitais.com.br -d app.helpideiasdigitais.com.br</p>
            <p className="text-slate-400 pt-2"># 3. Testar a renovação automática periódica (cron)</p>
            <p className="text-emerald-400">sudo certbot renew --dry-run</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <p>
              O Certbot configura a renovação automática antes de 90 dias, mantendo a nota <strong>A+ no SSL Labs</strong> e seu HTTPS permanentemente válido.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: Nginx Production Configuration */}
      {activeTab === 'nginx' && (
        <div className="space-y-4 animate-in fade-in text-xs">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400">
              Copie o arquivo de configuração pré-testado do Nginx com suporte a SPA e cabeçalhos rígidos de cibersegurança:
            </p>
            <button
              type="button"
              onClick={() => handleCopyCode(nginxConfigCode, 'nginx')}
              className="px-3 py-1.5 rounded-xl bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              {copiedCode === 'nginx' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedCode === 'nginx' ? 'Código Copiado!' : 'Copiar Nginx Config'}</span>
            </button>
          </div>

          <pre className="bg-[#0a1224] text-slate-300 rounded-2xl p-4 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed max-h-[360px]">
            {nginxConfigCode}
          </pre>
        </div>
      )}
    </div>
  );
};
