import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

console.log('%c🚀 ProjectFlow Frontend', 'color:#4f8ef7;font-size:16px;font-weight:600')
console.log('%cEnvironment: development | API: /api (proxied to :5000)', 'color:#8b919e')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1e25',
            color: '#e8eaf0',
            border: '1px solid #252b35',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#1a1e25' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#1a1e25' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
