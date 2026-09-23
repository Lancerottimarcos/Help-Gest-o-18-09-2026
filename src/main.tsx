import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { installConsoleSecurityFilter } from './utils/securityLogger.ts';
import { enforceHttpsRuntime } from './utils/securityProtocols.ts';

// Ativa protocolo de segurança para interceptar e prevenir vazamento de dados sensíveis (CPF, endereço) em logs
installConsoleSecurityFilter();

// Protocolo de Segurança: Força HTTPS com HSTS ativo e redirecionamento automático
enforceHttpsRuntime();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
