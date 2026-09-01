import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import "./responsive-fixes.css";

import App from "./App.jsx";
import { DialogProvider } from "./context/DialogContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <DialogProvider>
        <App />
      </DialogProvider>
    </BrowserRouter>
  </StrictMode>
);
