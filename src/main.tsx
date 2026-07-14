import { createRoot } from "react-dom/client";

import App from "./App";

import "./css/reset.css";
import "./css/tokens.css";
import "./css/index.css";
import "./css/style.css";

createRoot(document.getElementById("root")!).render(<App />);
