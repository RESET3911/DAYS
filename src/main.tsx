import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import HubButton from './shared/HubButton';
import AuthGate from './shared/AuthGate';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthGate>
      <HubButton />
      <App />
    </AuthGate>
  </React.StrictMode>
);
