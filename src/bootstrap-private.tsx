import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './utils/umami';
import './i18n/config';
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
