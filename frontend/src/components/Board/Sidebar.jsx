import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useBoards } from '../../context/BoardContext'
import CreateBoardModal from './CreateBoardModal'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { boards, currentBoardId, setCurrentBoardId, fetchBoards } = useBoards()
  const navigate = useNavigate()
  const [showCreateBoard, setShowCreateBoard] = useState(false)
  const [editingBoardId, setEditingBoardId] = useState(null)
  const [editName, setEditName] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const startEdit = (board) => {
    setEditingBoardId(board.id)
    setEditName(board.name)
  }

  const saveEdit = async (boardId) => {
    if (editName.trim() === '') return
    try {
      await axios.put(`/api/boards/${boardId}`, { name: editName })
      fetchBoards()
    } catch (e) {
      toast.error('Ошибка переименования')
    }
    setEditingBoardId(null)
  }

  const handleDelete = async (boardId) => {
    if (!confirm('Удалить доску и все её задачи?')) return
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
        {boards.map(board => (
          <div
            key={board.id}
            className={`nav-item ${board.id === currentBoardId ? 'active' : ''}`}
            onClick={() => {
              setCurrentBoardId(board.id)
              navigate(`/board/${board.id}`)
            }}
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
                <span
                  className="edit-icon"
                  onClick={e => { e.stopPropagation(); startEdit(board) }}
                  title="Редактировать"
                >✎</span>
                <span
                  className="delete-icon"
                  onClick={e => { e.stopPropagation(); handleDelete(board.id) }}
                  title="Удалить"
                >🗑</span>
              </>
            )}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="nav-item" onClick={() => setShowCreateBoard(true)}>
          + Новая доска
        </div>
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
                <button className="logout-icon-btn" onClick={handleLogout} title="Выйти">
                  🚪
                </button>
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