import Home from "./pages/Home";
import GuidePage from "./pages/Guide";

import { HashRouter, Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/guide" element={<GuidePage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
