import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { WebSocketProvider } from './context/WebSocketContext'
import Layout from './components/Layout'
import Board from './components/Board/Board'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import { Toaster } from 'react-hot-toast'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/board" element={<Layout><Board /></Layout>} />
            <Route path="*" element={<Navigate to="/board" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </WebSocketProvider>
    </AuthProvider>
  )
}

export default App