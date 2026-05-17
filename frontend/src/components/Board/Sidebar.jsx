import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { useBoards } from '../../context/BoardContext'
import { useWebSocket } from '../../context/WebSocketContext'
import CreateBoardModal from './CreateBoardModal'
import toast from 'react-hot-toast'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { boards, currentBoardId, setCurrentBoardId, fetchBoards } = useBoards()
  const { messages } = useWebSocket()
  const navigate = useNavigate()
  const [showCreateBoard, setShowCreateBoard] = useState(false)
  const [editingBoardId, setEditingBoardId] = useState(null)
  const [editName, setEditName] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [invitationCount, setInvitationCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      axios.get('/api/invitations').then(res => setInvitationCount(res.data.length)).catch(() => {})
      axios.get('/api/notifications/count-unread').then(res => setUnreadCount(res.data.count)).catch(() => {})
    }
  }, [user, boards])

  useEffect(() => {
    if (messages.length === 0) return
    const last = messages[messages.length - 1]
    if (last.type === 'notification_new') {
      setUnreadCount(prev => prev + 1)
    }
  }, [messages])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const startEdit = (board) => {
    setEditingBoardId(board.id)
    setEditName(board.name)
  }

  const saveEdit = async (boardId) => {
    if (!editName.trim()) return
    try {
      await axios.put(`/api/boards/${boardId}`, { name: editName })
      fetchBoards()
    } catch (e) {
      toast.error('Ошибка переименования')
    }
    setEditingBoardId(null)
  }

  const handleDelete = async (boardId) => {
    if (!confirm('Удалить доску?')) return
    try {
      await axios.delete(`/api/boards/${boardId}`)
      if (currentBoardId === boardId) {
        setCurrentBoardId(null)
        navigate('/board')
      }
      fetchBoards()
      toast.success('Доска удалена')
    } catch (e) {
      toast.error('Ошибка удаления')
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">ДоДырТим</div>
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={() => navigate('/invitations')}>
          📨 Приглашения {invitationCount > 0 && <span className="badge">{invitationCount}</span>}
        </div>
        <div className="nav-item" onClick={() => navigate('/notifications')}>
          🔔 Уведомления {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </div>
        {boards.map(board => (
          <div
            key={board.id}
            className={`nav-item ${board.id === currentBoardId ? 'active' : ''}`}
            onClick={() => { setCurrentBoardId(board.id); navigate(`/board/${board.id}`) }}
            style={{ position: 'relative' }}
          >
            <span className="nav-dot" style={{ background: '#5e6ad2' }}></span>
            {editingBoardId === board.id ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => saveEdit(board.id)}
                onKeyDown={e => e.key === 'Enter' && saveEdit(board.id)}
                autoFocus
                className="board-edit-input"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span style={{ flex: 1 }}>{board.name}</span>
            )}
            {editingBoardId !== board.id && (
              <>
                <span className="edit-icon" onClick={e => { e.stopPropagation(); startEdit(board) }}>✎</span>
                <span className="delete-icon" onClick={e => { e.stopPropagation(); handleDelete(board.id) }}>🗑</span>
              </>
            )}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="nav-item" onClick={() => setShowCreateBoard(true)}>+ Новая доска</div>
        {user ? (
          <div
            className="user-menu"
            onMouseEnter={() => setShowUserMenu(true)}
            onMouseLeave={() => setShowUserMenu(false)}
          >
            <div className="nav-item user-info" style={{ cursor: 'default' }}>
              <span className="avatar">😎</span>
              <div>
                <span className="username">{user.username}</span>
                <span className="user-role">{user.role === 'admin' ? 'Администратор' : 'Пользователь'}</span>
              </div>
              {showUserMenu && (
                <button className="logout-icon-btn" onClick={handleLogout}>🚪</button>
              )}
            </div>
          </div>
        ) : (
          <div className="nav-item" onClick={() => navigate('/login')}>Войти</div>
        )}
      </div>
      {showCreateBoard && <CreateBoardModal onClose={() => setShowCreateBoard(false)} />}
    </aside>
  )
}