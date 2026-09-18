import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  TwoFactorChallenge,
  TwoFactorActionType,
  TwoFactorRiskLevel,
  create2FaChallenge,
  shouldRequire2Fa,
  cancel2FaChallenge
} from '../utils/twoFactorAuth';
import { TwoFactorModal } from '../components/TwoFactorModal';

export interface Request2FaOptions {
  actionTitle: string;
  actionDescription: string;
  actionType: TwoFactorActionType;
  riskLevel?: TwoFactorRiskLevel;
  targetCount?: number;
  onVerified: () => void | Promise<void>;
  onCancel?: () => void;
}

interface TwoFactorContextType {
  request2Fa: (options: Request2FaOptions) => void;
  is2FaOpen: boolean;
}

const TwoFactorContext = createContext<TwoFactorContextType>({
  request2Fa: () => {},
  is2FaOpen: false,
});

export const TwoFactorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [pendingSuccess, setPendingSuccess] = useState<(() => void | Promise<void>) | null>(null);
  const [pendingCancel, setPendingCancel] = useState<(() => void) | null>(null);

  const request2Fa = useCallback((options: Request2FaOptions) => {
    // If 2FA is not required for this action type according to security settings, bypass and execute immediately
    if (!shouldRequire2Fa(options.actionType)) {
      options.onVerified();
      return;
    }

    const newChallenge = create2FaChallenge({
      actionTitle: options.actionTitle,
      actionDescription: options.actionDescription,
      actionType: options.actionType,
      riskLevel: options.riskLevel,
      targetCount: options.targetCount,
    });

    setChallenge(newChallenge);
    setPendingSuccess(() => options.onVerified);
    setPendingCancel(() => options.onCancel || null);
    setIsOpen(true);
  }, []);

  const handleVerified = useCallback(() => {
    setIsOpen(false);
    const cb = pendingSuccess;
    const verifiedAction = challenge?.actionTitle;
    setPendingSuccess(null);
    setPendingCancel(null);
    setChallenge(null);

    try {
      window.dispatchEvent(
        new CustomEvent('help_agency_notification', {
          detail: {
            id: `notif-2fa-${Date.now()}`,
            title: 'Ação Sensível Aprovada com 2FA',
            message: `A ação "${verifiedAction || 'Operação protegida'}" foi autenticada com sucesso via código temporário.`,
            timestamp: 'Agora mesmo',
            type: 'security',
            read: false,
            targetPage: 'configuracoes',
            actionLabel: 'Ver Logs',
          },
        })
      );
    } catch {}

    if (cb) {
      cb();
    }
  }, [pendingSuccess, challenge]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    const cb = pendingCancel;
    setPendingSuccess(null);
    setPendingCancel(null);
    setChallenge(null);
    cancel2FaChallenge();
    if (cb) {
      cb();
    }
  }, [pendingCancel]);

  return (
    <TwoFactorContext.Provider value={{ request2Fa, is2FaOpen: isOpen }}>
      {children}
      <TwoFactorModal
        isOpen={isOpen}
        challenge={challenge}
        onVerified={handleVerified}
        onCancel={handleCancel}
      />
    </TwoFactorContext.Provider>
  );
};

export const useTwoFactor = () => useContext(TwoFactorContext);
