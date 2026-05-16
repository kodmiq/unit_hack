import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'

const WebSocketContext = createContext()

export const WebSocketProvider = ({ children }) => {
  const { token } = useAuth()
  const [messages, setMessages] = useState([])
  const ws = useRef(null)

  useEffect(() => {
    if (!token) return
    const url = `ws://localhost:8080/ws?token=${token}`
    try {
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
      ws.current.onclose = () => console.log('WS closed')
    } catch (e) {
      console.error('WS connection failed', e)
    }
    return () => {
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

export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext)
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider')
  return ctx
}