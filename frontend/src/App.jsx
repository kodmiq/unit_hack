import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { WebSocketProvider } from './context/WebSocketContext'
import { BoardProvider } from './context/BoardContext'
import Layout from './components/Layout'
import Board from './components/Board/Board'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import InvitationList from './components/Invitations/InvitationList'
import Notifications from './components/Notifications/Notifications' 
import { Toaster } from 'react-hot-toast'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <BoardProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/board/:boardId" element={<Layout><Board /></Layout>} />
              <Route path="/board" element={<Layout><Board /></Layout>} />
              <Route path="/invitations" element={<Layout><InvitationList /></Layout>} />
              <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </BoardProvider>
      </WebSocketProvider>
    </AuthProvider>
  )
}

export default App