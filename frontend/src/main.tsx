
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  // Make sure index.css exists in the same folder as main.tsx, or update the path below if it's elsewhere
  import "./index.css";

  createRoot(document.getElementById("root")!).render(<App />);
  