import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './utils/umami'; // Inject the Umami analytics script as early as possible
import './i18n/config'; // Initialize i18n before rendering
import './styles/globals.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
