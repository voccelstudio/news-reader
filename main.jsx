import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './news_dashboard.jsx' // <--- CLAVE: Que el nombre sea igual al archivo

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
