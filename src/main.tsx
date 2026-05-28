import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import { checkForAppUpdate } from "./lib/appUpdate";
import "./styles.css";

void checkForAppUpdate();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
