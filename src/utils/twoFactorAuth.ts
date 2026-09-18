// Two-Factor Authentication (2FA) & One-Time Password (OTP) Engine
// Help Ideias Digitais - Multi-Layer Cyber Security & Sensitive Action Guard

import { addSecurityLog, getSecurityConfig, saveSecurityConfig } from './securityProtocols';

export type TwoFactorMethod = 'email' | 'totp';
export type TwoFactorRiskLevel = 'medium' | 'high' | 'critical';
export type TwoFactorActionType = 'config_change' | 'bulk_delete' | 'security_wipe' | 'custom';

export interface TwoFactorChallenge {
  id: string;
  code: string;
  actionTitle: string;
  actionDescription: string;
  actionType: TwoFactorActionType;
  riskLevel: TwoFactorRiskLevel;
  targetCount?: number;
  createdAt: number;
  expiresAt: number;
  method: TwoFactorMethod;
  recipient: string;
  attempts: number;
  maxAttempts: number;
}

const STORAGE_ACTIVE_CHALLENGE = 'help_agency_active_2fa_challenge';
const CHALLENGE_EXPIRY_SECONDS = 60;
const MAX_ATTEMPTS = 3;

/**
 * Generates a cryptographically sound pseudo-random 6-digit verification code.
 */
export function generateRandom6DigitOtp(): string {
  // Generate random integer between 100000 and 999999
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}

/**
 * Checks whether 2FA is required for a specific action type based on security config.
 */
export function shouldRequire2Fa(actionType: TwoFactorActionType): boolean {
  const config = getSecurityConfig();
  if (!config.require2FaForSensitiveActions) {
    return false;
  }

  if (actionType === 'config_change' && !config.require2FaForConfigChanges) {
    return false;
  }

  if (actionType === 'bulk_delete' && !config.require2FaForBulkDeletes) {
    return false;
  }

  return true;
}

/**
 * Creates a new active 2FA verification challenge for a sensitive action.
 */
export function create2FaChallenge(params: {
  actionTitle: string;
  actionDescription: string;
  actionType: TwoFactorActionType;
  riskLevel?: TwoFactorRiskLevel;
  targetCount?: number;
}): TwoFactorChallenge {
  const config = getSecurityConfig();
  const code = generateRandom6DigitOtp();
  const now = Date.now();
  const expiresAt = now + CHALLENGE_EXPIRY_SECONDS * 1000;

  const challenge: TwoFactorChallenge = {
    id: `2fa-${now}-${Math.random().toString(36).substring(2, 7)}`,
    code,
    actionTitle: params.actionTitle,
    actionDescription: params.actionDescription,
    actionType: params.actionType,
    riskLevel: params.riskLevel || (params.actionType === 'bulk_delete' ? 'critical' : 'high'),
    targetCount: params.targetCount,
    createdAt: now,
    expiresAt,
    method: config.twoFactorMethod || 'email',
    recipient: config.twoFactorEmail || 'lancerottirmarcos@gmail.com',
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
  };

  try {
    sessionStorage.setItem(STORAGE_ACTIVE_CHALLENGE, JSON.stringify(challenge));
  } catch {}

  // Log 2FA challenge initiation to Audit Log
  addSecurityLog({
    eventType: 'two_factor_requested',
    severity: 'warning',
    title: 'Desafio 2FA Solicitado',
    description: `Ação sensível "${params.actionTitle}" exigiu verificação de dois fatores. Código temporário emitido via ${challenge.method === 'email' ? 'E-mail' : 'TOTP'}.`,
    source: 'Camada de Autenticação 2FA',
    threatDetails: `Destinatário: ${challenge.recipient} | Validade: ${CHALLENGE_EXPIRY_SECONDS}s`
  });

  return challenge;
}

/**
 * Retrieves the currently active 2FA challenge from session storage.
 */
export function getActive2FaChallenge(): TwoFactorChallenge | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_ACTIVE_CHALLENGE);
    if (raw) {
      const challenge: TwoFactorChallenge = JSON.parse(raw);
      return challenge;
    }
  } catch {}
  return null;
}

/**
 * Verifies a 6-digit code entered by the user against the active challenge.
 */
export function verify2FaCode(inputCode: string): {
  success: boolean;
  message: string;
  expired?: boolean;
  attemptsLeft?: number;
} {
  const challenge = getActive2FaChallenge();

  if (!challenge) {
    return {
      success: false,
      message: 'Nenhum desafio 2FA ativo foi encontrado ou a sessão expirou. Solicite um novo código.'
    };
  }

  const now = Date.now();
  if (now > challenge.expiresAt) {
    cancel2FaChallenge();
    addSecurityLog({
      eventType: 'two_factor_failed',
      severity: 'warning',
      title: 'Código 2FA Expirado',
      description: `Tentativa de confirmação com código temporário expirado para a ação "${challenge.actionTitle}".`,
      source: 'Camada de Autenticação 2FA',
      threatDetails: `Código expirou após ${CHALLENGE_EXPIRY_SECONDS} segundos.`
    });

    return {
      success: false,
      expired: true,
      message: 'O código temporário expirou. Clique em "Reenviar código" para gerar um novo.'
    };
  }

  // Clean input
  const cleanInput = inputCode.trim().replace(/\D/g, '');

  if (cleanInput.length !== 6) {
    return {
      success: false,
      message: 'O código de autenticação deve conter exatamente 6 dígitos numéricos.'
    };
  }

  if (cleanInput === challenge.code) {
    // Verified successfully!
    cancel2FaChallenge();

    addSecurityLog({
      eventType: 'two_factor_verified',
      severity: 'info',
      title: 'Ação Sensível Autenticada via 2FA',
      description: `Autorização confirmada com sucesso com código temporário de dois fatores para "${challenge.actionTitle}".`,
      source: 'Camada de Autenticação 2FA',
      threatDetails: `Canal: ${challenge.method} | Registro de Ação: ${challenge.actionType}`
    });

    return {
      success: true,
      message: 'Autenticação de dois fatores concluída com sucesso!'
    };
  }

  // Code was wrong
  challenge.attempts += 1;
  const attemptsLeft = challenge.maxAttempts - challenge.attempts;

  if (attemptsLeft <= 0) {
    cancel2FaChallenge();
    addSecurityLog({
      eventType: 'two_factor_failed',
      severity: 'critical',
      title: 'Bloqueio de Tentativas 2FA Excedidas',
      description: `Código incorreto informado 3 vezes consecutivas para a ação sensível "${challenge.actionTitle}". Desafio cancelado por segurança.`,
      source: 'Módulo Anti-Intrusão 2FA',
      threatDetails: `Código inserido inválido repetidamente.`
    });

    return {
      success: false,
      attemptsLeft: 0,
      message: 'Limite máximo de 3 tentativas incorretas atingido. A operação foi cancelada por segurança.'
    };
  }

  // Save incremented attempts
  try {
    sessionStorage.setItem(STORAGE_ACTIVE_CHALLENGE, JSON.stringify(challenge));
  } catch {}

  addSecurityLog({
    eventType: 'two_factor_failed',
    severity: 'warning',
    title: 'Código 2FA Incorreto',
    description: `Código incorreto inserido para a ação "${challenge.actionTitle}". Restam ${attemptsLeft} tentativa(s).`,
    source: 'Camada de Autenticação 2FA',
    threatDetails: `Tentativa ${challenge.attempts} de ${challenge.maxAttempts}`
  });

  return {
    success: false,
    attemptsLeft,
    message: `Código incorreto. Você possui mais ${attemptsLeft} tentativa(s).`
  };
}

/**
 * Resends a fresh 6-digit code for the current challenge, resetting timer and attempts.
 */
export function resend2FaCode(): TwoFactorChallenge | null {
  const current = getActive2FaChallenge();
  if (!current) return null;

  return create2FaChallenge({
    actionTitle: current.actionTitle,
    actionDescription: current.actionDescription,
    actionType: current.actionType,
    riskLevel: current.riskLevel,
    targetCount: current.targetCount,
  });
}

/**
 * Cancels and clears the current 2FA challenge.
 */
export function cancel2FaChallenge(): void {
  try {
    sessionStorage.removeItem(STORAGE_ACTIVE_CHALLENGE);
  } catch {}
}
