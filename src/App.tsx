import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import './App.css';

import Main from "./pages/Main.tsx";
import Checklist from './pages/Checklist.tsx';

function App() {
  return (
      <div id="body" className="p-5 w-100">
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
