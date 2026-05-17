import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function InviteModal({ boardId, onClose }) {
  const [email, setEmail] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`/api/boards/${boardId}/invite`, { email })
      toast.success('Приглашение отправлено')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Пригласить пользователя</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email пользователя"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">Отправить</button>
          </div>
        </form>
      </div>
    </div>
  )
}