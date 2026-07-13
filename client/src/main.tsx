import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { initializeAnalytics } from "./services/analytics";
import App from "./App";
import "./index.css";
import "./i18n";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
  });
}

initializeAnalytics();

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
