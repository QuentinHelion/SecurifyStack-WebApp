import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

import Checklist from './pages/Checklist';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path="/" element={<Checklist />} />
      <Route path="/checklist" element={<Checklist />} />
  </Routes>
  )
}

export default App
