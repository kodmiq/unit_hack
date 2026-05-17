import { useState } from 'react'
import axios from 'axios'
import { useBoards } from '../../context/BoardContext'

export default function CreateBoardModal({ onClose }) {
  const [name, setName] = useState('')
  const { fetchBoards } = useBoards()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/boards', { name })
      fetchBoards()
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Создать новую доску</h2>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Название доски"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">Создать</button>
          </div>
        </form>
      </div>
    </div>
  )
}