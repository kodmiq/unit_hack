import { Link } from 'react-router-dom'

export default function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">ДоДырТим</div>
      <nav className="sidebar-nav">
        <div className="nav-item active">
          <span className="nav-dot" style={{ background: '#5e6ad2' }}></span>
          Канбан-доска
        </div>
      </nav>
      <div className="sidebar-footer">
        <div className="nav-item" onClick={onLogout}>🚪 Выйти</div>
      </div>
    </aside>
  )
}