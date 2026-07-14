import { createRoot } from "react-dom/client";

import App from "./App.tsx";

// css
import "./css/reset.css";
import "./css/index.css";
import "./css/style.css";
import "./css/utilities.css";

createRoot(document.getElementById("root")!).render(<App />);
