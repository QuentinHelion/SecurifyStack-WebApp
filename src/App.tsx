import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

import Checklist from './pages/Checklist.tsx';
import Main from "./pages/Main.tsx";

function App() {
  return (
      <div className="p-5">
        <Router>
            <Routes>
              <Route path="/" element={<Main />} />
              <Route path="/checklist" element={<Checklist />} />
            </Routes>
        </Router>
      </div>
  );
}

export default App;
