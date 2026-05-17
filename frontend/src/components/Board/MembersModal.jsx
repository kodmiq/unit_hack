import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useBoards } from '../../context/BoardContext'

export default function MembersModal({ boardId, onClose }) {
  const [members, setMembers] = useState([])
  const { user } = useAuth()
  const { fetchBoards } = useBoards()

  useEffect(() => {
    axios.get(`/api/boards/${boardId}/members`)
      .then(res => setMembers(res.data))
      .catch(() => toast.error('Ошибка загрузки участников'))
  }, [boardId])

  const handleRemove = async (memberId) => {
    if (!confirm('Удалить участника?')) return
    try {
      await axios.delete(`/api/boards/${boardId}/members/${memberId}`)
      setMembers(prev => prev.filter(m => m.user_id !== memberId))
      toast.success('Участник удалён')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Участники доски</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {members.map(m => (
            <li key={m.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <div>
                <span className="avatar">😎</span>
                <span style={{ marginLeft: 8 }}>{m.user?.username || m.user_id}</span>
                {m.role === 'owner' && <span style={{ color: '#f2c94c', marginLeft: 8 }}>Владелец</span>}
              </div>
              {user?.id !== m.user_id && m.role !== 'owner' && (
                <button onClick={() => handleRemove(m.user_id)} style={{ background: '#eb5a46', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px' }}>Удалить</button>
              )}
            </li>
          ))}
        </ul>
        <div className="modal-buttons">
          <button onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}