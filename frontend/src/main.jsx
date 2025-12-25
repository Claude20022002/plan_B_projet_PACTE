import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Accueil from './pages/Accueil.jsx'
import Connexion from './pages/Connexion.jsx'
import { BrowserRouter,Route, Routes } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/connexion" element={<Connexion />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
