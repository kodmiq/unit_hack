import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const BoardContext = createContext()

export const BoardProvider = ({ children }) => {
  const { token } = useAuth()
  const [boards, setBoards] = useState([])
  const [currentBoardId, setCurrentBoardId] = useState(null)

  const fetchBoards = useCallback(async () => {
    try {
      const res = await axios.get('/api/boards')
      setBoards(res.data)
    } catch (err) {
      console.error('Ошибка загрузки досок', err)
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchBoards()
    }
  }, [token, fetchBoards])

  return (
    <BoardContext.Provider value={{ boards, currentBoardId, setCurrentBoardId, fetchBoards }}>
      {children}
    </BoardContext.Provider>
  )
}

export const useBoards = () => {
  const ctx = useContext(BoardContext)
  if (!ctx) throw new Error('useBoards must be used within BoardProvider')
  return ctx
}