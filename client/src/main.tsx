import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { STATIC_MODE } from './lib/api';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import './index.css';

/** GitHub Pages cannot rewrite unknown paths to index.html, so the static build uses hash URLs (#/dashboard). */
const Router = STATIC_MODE ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <LocationProvider>
          <App />
        </LocationProvider>
      </AuthProvider>
    </Router>
  </StrictMode>,
);
