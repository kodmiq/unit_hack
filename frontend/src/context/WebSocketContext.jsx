import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'

const WebSocketContext = createContext()

export const WebSocketProvider = ({ children }) => {
  const { token } = useAuth()
  const [messages, setMessages] = useState([])
  const ws = useRef(null)
  const reconnectTimeout = useRef(null)

  const connect = () => {
    if (!token) return
    
    // Определяем протокол и хост
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.host
    
    let url
    if (host.includes('localhost')) {
        url = `ws://localhost:8080/ws?token=${token}`
    } else if (host.includes('railway.app')) {
        // Railway предоставляет общий URL, бэкенд доступен по тому же домену через nginx
        url = `${protocol}://${host}/ws?token=${token}`
    } else {
        url = `${protocol}://${host}/ws?token=${token}`
    }
    
    ws.current = new WebSocket(url)

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setMessages(prev => [...prev, data])
      } catch (e) {
        console.error('WS parse error', e)
      }
    }

    ws.current.onerror = (e) => console.error('WebSocket error', e)

    ws.current.onclose = () => {
      console.log('WS closed, reconnecting in 3s...')
      reconnectTimeout.current = setTimeout(connect, 3000)
    }
  }

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimeout.current)
      ws.current?.close()
    }
  }, [token])

  const sendMessage = (msg) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg))
    }
  }

  return (
    <WebSocketContext.Provider value={{ messages, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => useContext(WebSocketContext)