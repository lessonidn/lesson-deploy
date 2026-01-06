import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { HelmetProvider } from "react-helmet-async"
import { AuthProvider } from "./contexts/AuthContext"
import App from "./app/App"
import "./index.css"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error(
    "Root element not found. Did you forget <div id='root'/> in index.html?"
  )
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        {/* ✅ Bungkus App dengan AuthProvider */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)