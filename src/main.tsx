import React from "react";
import ReactDOM from "react-dom/client";
import { PostHogErrorBoundary, PostHogProvider } from "@posthog/react";
import App from "./components/App";
import { initializePostHog } from "./lib/analytics";
import { checkForAppUpdate } from "./lib/appUpdate";
import "./styles.css";

void checkForAppUpdate();

const posthogClient = initializePostHog();
const app = posthogClient ? (
  <PostHogProvider client={posthogClient}>
    <PostHogErrorBoundary fallback={<div className="grid min-h-screen place-items-center bg-paper p-6 text-center text-ink">Bir şey ters gitti.</div>}>
      <App />
    </PostHogErrorBoundary>
  </PostHogProvider>
) : (
  <App />
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {app}
  </React.StrictMode>
);
