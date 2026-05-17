import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function TaskModal({ columnId, task, boardId, onClose, onSaved, canDelete = true }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    deadline: task?.deadline ? task.deadline.slice(0, 10) : '',
    tags: task?.tags || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      column_id: columnId,
      board_id: boardId,
      deadline: form.deadline ? form.deadline + 'T00:00:00Z' : null,
      tags: form.tags
    }
    try {
      if (task) {
        await axios.put(`/api/tasks/${task.id}`, payload)
        toast.success('Обновлено')
      } else {
        await axios.post('/api/tasks', payload)
        toast.success('Создано')
      }
      onSaved()
    } catch (err) {
      toast.error('Ошибка')
    }
  }

  const handleDelete = async () => {
    if (!task || !canDelete) return
    if (!confirm('Удалить задачу?')) return
    try {
      await axios.delete(`/api/tasks/${task.id}`)
      toast.success('Удалено')
      onSaved()
    } catch (err) {
      toast.error('Ошибка удаления')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{task ? 'Редактировать' : 'Новая задача'}</h2>
        <form onSubmit={handleSubmit}>
          <input placeholder="Название" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <textarea placeholder="Описание" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
          <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
          <input placeholder="Теги через запятую" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
          <div className="modal-buttons">
            {task && canDelete && (
              <button type="button" onClick={handleDelete} style={{ background: '#eb5a46', color: 'white' }}>Удалить</button>
            )}
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">{task ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}