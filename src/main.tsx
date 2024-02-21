import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import Navbar from './components/navbar.tsx';
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <div className="d-flex no-wrap">
          <Navbar />
          <App />
      </div>
  </React.StrictMode>,
)
