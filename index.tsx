import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { DataProvider } from './context/DataContext';
import { FirebaseProvider } from './context/FirebaseContext';
import ErrorBoundary from './components/ErrorBoundary';
import * as Sentry from "@sentry/react";
import { GoogleOAuthProvider } from '@react-oauth/google';

/**
 * SOVEREIGN OS - GENESIS BLOCK
 * Observability & Neural Core Initialization
 */

// Production-grade error suppression for ResizeObserver issues common in heavy dashboard layouts.
const IGNORED_ERRORS = [
  'ResizeObserver loop completed with undelivered notifications.',
  'ResizeObserver loop limit exceeded'
];

window.addEventListener('error', (e) => {
  if (IGNORED_ERRORS.includes(e.message)) {
    // Prevent the error from bubbling to the console or showing in dev overlays
    e.stopImmediatePropagation();
  }
});

try {
  Sentry.init({
    dsn: "https://61e955ceb70b4912d4815245a6b2bbf4@o4510668129173504.ingest.us.sentry.io/4510668131401728",
    ignoreErrors: IGNORED_ERRORS,
    integrations: Sentry.getDefaultIntegrations({}).filter(
      (integration) => 
        integration.name !== "Fetch" && 
        integration.name !== "XHR"
    ).concat([
      Sentry.browserTracingIntegration(),
      Sentry.browserProfilingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ]),
    // Tracing
    tracesSampleRate: 1.0,
    tracePropagationTargets: [/^https:\/\/.*\.run\.app/, /localhost/],
    // Profiling
    profileSessionSampleRate: 1.0, // Profile every session
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  if ((Sentry as any).metrics) {
    Sentry.metrics.count('app_initialization', 1);
  }
} catch (e) {
  console.warn("[Sovereign OS] Observability layer bypass triggered:", e);
}

import { Auth0Provider } from '@auth0/auth0-react';
import { PortalProvider } from './context/PortalContext';
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";

const ConfigLoader = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfig] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pca, setPca] = React.useState<PublicClientApplication | null>(null);

  React.useEffect(() => {
    const config = {
      auth0: {
        domain: import.meta.env.VITE_AUTH0_DOMAIN || "",
        clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || ""
      },
      googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
      azure: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "bff526e7-323a-4ab1-8378-1afdf6936639",
        authority: import.meta.env.VITE_AZURE_AUTHORITY || "https://login.microsoftonline.com/jamescitibankdemobusiness.onmicrosoft.com"
      }
    };

    setConfig(config);
    
    const msalConfig = {
      auth: {
        clientId: config.azure.clientId,
        authority: config.azure.authority,
        redirectUri: window.location.origin, 
      },
      cache: { cacheLocation: "sessionStorage" }
    };
    
    try {
      const instance = new PublicClientApplication(msalConfig);
      instance.initialize().then(() => {
        setPca(instance);
      }).catch((err) => {
        console.error("MSAL Initialization Failure:", err);
        setError("Neural Identity Handshake Failed.");
      });
    } catch (pcaErr) {
      console.error("MSAL Initialization Failure:", pcaErr);
      setError("Neural Identity Handshake Failed.");
    }
  }, []);

  if (error) {
    return (
      <div style={{ padding: '40px', color: '#ef4444', background: '#030712', fontFamily: 'monospace', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {error}
      </div>
    );
  }

  if (!config || !pca) {
    return (
      <div style={{ background: '#030712', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '2px solid #1e293b', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <MsalProvider instance={pca}>
      <Auth0Provider
        domain={config.auth0.domain || import.meta.env.VITE_AUTH0_DOMAIN || ""}
        clientId={config.auth0.clientId || import.meta.env.VITE_AUTH0_CLIENT_ID || ""}
        authorizationParams={{
          redirect_uri: window.location.origin
        }}
      >
        <GoogleOAuthProvider clientId={config.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
          {children}
        </GoogleOAuthProvider>
      </Auth0Provider>
    </MsalProvider>
  );
};

const render = () => {
  const container = document.getElementById('app') || document.getElementById('root');
  
  if (!container) {
    console.error("Critical Error: No mount point detected in DOM.");
    return;
  }

  try {
    // Fix for: TypeError: Cannot set property fetch of #<Window> which has only a getter
    const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (descriptor && !descriptor.writable) {
      Object.defineProperty(window, 'fetch', {
        value: window.fetch,
        writable: true,
        configurable: true
      });
    }
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <ConfigLoader>
          <ErrorBoundary>
            <FirebaseProvider>
              <PortalProvider>
                <DataProvider>
                  <App />
                </DataProvider>
              </PortalProvider>
            </FirebaseProvider>
          </ErrorBoundary>
        </ConfigLoader>
      </React.StrictMode>
    );
  } catch (err) {
    console.error("React Core Synthesis Failure:", err);
    container.innerHTML = `
      <div style="padding: 40px; color: #ef4444; background: #030712; font-family: 'Geist Mono', monospace; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
        <h1 style="font-size: 3rem; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 20px;">SYSTEM_HALT</h1>
        <p style="color: #94a3b8; max-width: 600px;">Initialization Failure. Neural handshake timeout.</p>
        <pre style="margin-top: 40px; padding: 20px; background: #111827; border: 1px solid #1f2937; border-radius: 12px; color: #6366f1; font-size: 0.8rem;">${err instanceof Error ? err.message : String(err)}</pre>
      </div>
    `;
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render);
} else {
  render();
}
