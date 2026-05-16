import { useState } from 'react'
import Sidebar from './Board/Sidebar'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout } = useAuth()

  return (
    <div className="app-layout">
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        ☰
      </button>
      <div className={`sidebar-container ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar onLogout={logout} />
      </div>
      <div className="main-area">
        {children}
      </div>
    </div>
  )
}