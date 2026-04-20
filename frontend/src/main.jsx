// ================= FRONTEND FILE =================
// File: main.jsx
// Purpose: Main initialization file for the React frontend
// Handles: Root rendering, global styles import, and BrowserRouter setup

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/global.css'
import './styles/components.css'
import './styles/landing.css'
import './styles/dashboard.css'
import './styles/auth.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
