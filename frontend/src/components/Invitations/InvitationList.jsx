import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useBoards } from '../../context/BoardContext'

export default function InvitationList() {
  const [invitations, setInvitations] = useState([])
  const { fetchBoards } = useBoards()

  useEffect(() => {
    axios.get('/api/invitations')
      .then(res => setInvitations(res.data))
      .catch(() => toast.error('Ошибка загрузки приглашений'))
  }, [])

  const handleAction = async (id, action) => {
    try {
      await axios.put(`/api/invitations/${id}/${action}`)
      setInvitations(prev => prev.filter(inv => inv.id !== id))
      if (action === 'accept') {
        fetchBoards()
        toast.success('Приглашение принято')
      } else {
        toast.success('Приглашение отклонено')
      }
    } catch (err) {
      toast.error('Ошибка')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Приглашения</h2>
      {invitations.length === 0 ? (
        <p>Нет входящих приглашений</p>
      ) : (
        invitations.map(inv => (
          <div key={inv.id} style={{ border: '1px solid #ccc', padding: 12, margin: '8px 0', borderRadius: 8 }}>
            <p>Вас пригласили в доску «{inv.board?.name}»</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleAction(inv.id, 'accept')}>Принять</button>
              <button onClick={() => handleAction(inv.id, 'decline')}>Отклонить</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}