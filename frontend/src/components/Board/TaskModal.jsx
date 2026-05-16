import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function TaskModal({ columnId, task, onClose, onSaved }) {
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
      column_id: columnId, // при создании
    }
    try {
      if (task) {
        await axios.put(`/api/tasks/${task.id}`, payload)
        toast.success('Задача обновлена')
      } else {
        await axios.post('/api/tasks', payload)
        toast.success('Задача создана')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка сохранения')
    }
  }

  const handleDelete = async () => {
    if (!task) return
    if (!confirm('Удалить задачу?')) return
    try {
      await axios.delete(`/api/tasks/${task.id}`)
      toast.success('Задача удалена')
      onSaved()
    } catch (err) {
      toast.error('Ошибка удаления')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{task ? 'Редактирование задачи' : 'Новая задача'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Название задачи"
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
            required
          />
          <textarea
            placeholder="Описание"
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
          />
          <select
            value={form.priority}
            onChange={e => setForm({...form, priority: e.target.value})}
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
          <input
            type="date"
            value={form.deadline}
            onChange={e => setForm({...form, deadline: e.target.value})}
          />
          <input
            type="text"
            placeholder="Теги через запятую"
            value={form.tags}
            onChange={e => setForm({...form, tags: e.target.value})}
          />
          <div className="modal-buttons">
            {task && (
              <button type="button" onClick={handleDelete} style={{ background: '#eb5a46', color: 'white' }}>
                Удалить
              </button>
            )}
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">{task ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}