import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    axios.get('/api/notifications')
      .then(res => setNotifications(res.data))
      .catch(console.error)
  }, [user])

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Уведомления</h2>
        <button onClick={handleMarkAllRead}>Прочитано всё</button>
      </div>
      {notifications.length === 0 && <p>Нет уведомлений</p>}
      {notifications.map(n => (
        <div key={n.id} style={{
          background: n.read ? '#f4f5f7' : '#fff',
          borderLeft: n.read ? '3px solid #ccc' : '3px solid #5e6ad2',
          padding: 12,
          marginBottom: 8,
          borderRadius: 4,
        }}>
          <p>{n.message}</p>
          <small>{new Date(n.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  )
}