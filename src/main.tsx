// Initialize Sentry before all other imports for proper error tracking
import { initSentry } from "./lib/sentry";
initSentry();

import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { AuthProvider } from "./components/providers/AuthProvider";
import { DrilldownProvider } from "./contexts/DrilldownContext";
import { router } from "./router/routes";
import { InspectProvider } from "./services/inspect/InspectContext";
import "./index.css";
import "./styles/design-tokens-responsive.css";
import "./styles/responsive-utilities.css";
import "./styles/dark-mode-enhancements.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const SentryRouterProvider = Sentry.withSentryReactRouterV6Routing(RouterProvider);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DrilldownProvider>
          <InspectProvider>
            <SentryRouterProvider router={router} />
          </InspectProvider>
        </DrilldownProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
