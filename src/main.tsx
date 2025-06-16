
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductionErrorBoundary from "./components/ProductionErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Error logging function for production
const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
  console.error('Application Error:', error, errorInfo);
  
  // In production, send to monitoring service
  if (import.meta.env.PROD) {
    // Example: Send to error tracking service
    // Sentry.captureException(error, { extra: errorInfo });
  }
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ProductionErrorBoundary onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ProductionErrorBoundary>
  </React.StrictMode>
);
