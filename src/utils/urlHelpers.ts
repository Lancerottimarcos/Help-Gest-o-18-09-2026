/**
 * Utilitários para geração e extração de links públicos compartilháveis com clientes.
 * 
 * Garante que:
 * 1. O link possa ser aberto diretamente pelo cliente sem necessidade de login.
 * 2. Em ambientes de desenvolvimento do Google Cloud Run / AI Studio, converte automaticamente
 *    o subdomínio restrito ('ais-dev-') para o subdomínio público aberto ('ais-pre-'),
 *    evitando que o Google Cloud exija login ou conta Google do cliente externo.
 * 3. Reconheça diversos formatos de URLs amigáveis (parâmetros de busca, caminhos e hashes).
 */

export function getPublicPortalBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://helpideias.com.br';
  }

  let origin = window.location.origin;

  // No Google AI Studio, o subdomínio 'ais-dev-' exige autenticação Google do desenvolvedor.
  // Já o subdomínio 'ais-pre-' é a URL pública homologada para testes e clientes externos sem qualquer login.
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }

  return origin;
}

export function getPublicProposalUrl(proposalId: string): string {
  const baseUrl = getPublicPortalBaseUrl();
  const cleanId = encodeURIComponent((proposalId || '').trim());
  return `${baseUrl}/?portal=orcamento&proposalId=${cleanId}`;
}

export function getPublicDemandUrl(demandId: string): string {
  const baseUrl = getPublicPortalBaseUrl();
  const cleanId = encodeURIComponent((demandId || '').trim());
  return `${baseUrl}/?portal=aprovacao&demandId=${cleanId}`;
}

/**
 * Extrai o identificador da proposta de orçamento a partir do objeto window.location
 * com tolerância a múltiplos formatos:
 * - ?portal=orcamento&proposalId=prop-123
 * - ?portal=orcamento&id=prop-123
 * - ?orcamentoId=prop-123
 * - ?proposalId=prop-123
 * - ?orcamento=prop-123
 * - ?proposta=prop-123
 * - Caminhos: /orcamento/prop-123, /proposta/prop-123, /p/prop-123
 * - Hash routes: #/orcamento/prop-123, #?portal=orcamento&proposalId=prop-123
 */
export function extractPublicProposalId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Search parameters diretos
    const params = new URLSearchParams(window.location.search);
    
    // Parâmetros com portal=orcamento explícito
    const isBudgetPortal = params.get('portal') === 'orcamento';
    if (isBudgetPortal) {
      const explicit = params.get('proposalId') || params.get('id') || params.get('orcamentoId') || params.get('propostaId') || params.get('code') || params.get('codigo');
      if (explicit) return explicit.trim();
    }

    // Parâmetros diretos sem necessidade do 'portal='
    const directParam = 
      params.get('proposalId') || 
      params.get('orcamentoId') || 
      params.get('propostaId') || 
      params.get('orcamento') || 
      params.get('proposta');

    if (directParam && params.get('portal') !== 'aprovacao') {
      return directParam.trim();
    }

    // 2. Análise de pathname (e.g. /orcamento/prop-123, /proposta/ORC-2026-001, /p/prop-123)
    const pathname = window.location.pathname || '';
    const pathMatch = pathname.match(/\/(?:orcamento|orcamentos|proposta|propostas|proposal|p)\/([^/?#]+)/i);
    if (pathMatch && pathMatch[1]) {
      const val = decodeURIComponent(pathMatch[1]).trim();
      if (val && val !== 'novo' && val !== 'lista') {
        return val;
      }
    }

    // 3. Análise de Hash (#/orcamento/prop-123 ou #?portal=orcamento&proposalId=...)
    const hash = window.location.hash || '';
    if (hash) {
      if (hash.includes('?')) {
        const queryPart = hash.substring(hash.indexOf('?'));
        const hashParams = new URLSearchParams(queryPart);
        const hashBudget = 
          hashParams.get('proposalId') || 
          hashParams.get('orcamentoId') || 
          hashParams.get('propostaId') ||
          (hashParams.get('portal') === 'orcamento' ? hashParams.get('id') : null);
        if (hashBudget) return hashBudget.trim();
      }

      const hashPathMatch = hash.match(/#(?:!|\/)?(?:orcamento|orcamentos|proposta|propostas|proposal|p)\/([^/?#]+)/i);
      if (hashPathMatch && hashPathMatch[1]) {
        const val = decodeURIComponent(hashPathMatch[1]).trim();
        if (val && val !== 'novo') return val;
      }
    }

    // 4. Fallback com Expressão Regular no href completo
    const fullHref = window.location.href || '';
    const regexMatch = fullHref.match(/[?&#](?:proposalId|orcamentoId|propostaId)=([^&#]+)/i);
    if (regexMatch && regexMatch[1]) {
      return decodeURIComponent(regexMatch[1]).trim();
    }
  } catch (e) {
    console.warn('Erro ao processar identificador de orçamento na URL:', e);
  }

  return null;
}

/**
 * Extrai o identificador de demanda do portal de aprovação rápida
 */
export function extractPublicDemandId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('portal') === 'aprovacao' && (params.get('demandId') || params.get('id'))) {
      return (params.get('demandId') || params.get('id'))!.trim();
    }
    if (params.get('demandId') || params.get('demandaId')) {
      return (params.get('demandId') || params.get('demandaId'))!.trim();
    }

    const pathname = window.location.pathname || '';
    const pathMatch = pathname.match(/\/(?:aprovacao|demanda)\/([^/?#]+)/i);
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1]).trim();
    }

    const hash = window.location.hash || '';
    if (hash.includes('?')) {
      const hashParams = new URLSearchParams(hash.substring(hash.indexOf('?')));
      if (hashParams.get('demandId')) return hashParams.get('demandId')!.trim();
    }
  } catch {}

  return null;
}
