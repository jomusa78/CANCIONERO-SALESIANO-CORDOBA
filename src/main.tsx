import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { RUNTIME_BUILD_TIME } from './utils/versionCheck';

if (typeof window !== 'undefined') {
  console.log(`[CANCIONERO SALESIANO] Version activa: ${RUNTIME_BUILD_TIME}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
