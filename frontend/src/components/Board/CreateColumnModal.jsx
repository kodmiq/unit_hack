import { useState } from 'react'
import axios from 'axios'

export default function CreateColumnModal({ boardId, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState('#b3b3b3')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/columns', { title, color, board_id: boardId })
      onCreated()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Новая колонка</h2>
        <form onSubmit={handleSubmit}>
          <input placeholder="Название" value={title} onChange={e => setTitle(e.target.value)} required />
          <input type="color" value={color} onChange={e => setColor(e.target.value)} />
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">Создать</button>
          </div>
        </form>
      </div>
    </div>
  )
}