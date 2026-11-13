import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { AuthProvider } from './lib/AuthProvider';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('root 요소를 찾을 수 없습니다.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
