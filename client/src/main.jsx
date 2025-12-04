import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./redux/store";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { googleClientId } from "../utils/config.js";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();
createRoot(document.getElementById("root")).render(
  
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <App />
        </Provider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
