import { useState } from 'react'
import './App.css';
import Navbar from './components/navbar.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';

//import "~bootstrap/scss/bootstrap"
// Import our custom CSS
// Import all of Bootstrap's JS
// import * as bootstrap from 'bootstrap'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <Navbar />
    </div>
  )
}

export default App
