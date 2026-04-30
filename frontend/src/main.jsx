import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Emergency Error Logger to prevent "Blackout"
window.onerror = function(message, source, lineno, colno, error) {
  alert("CRITICAL ERROR: " + message + "\nSource: " + source + ":" + lineno);
};

try {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (e) {
  alert("REACT MOUNT ERROR: " + e.message);
}
