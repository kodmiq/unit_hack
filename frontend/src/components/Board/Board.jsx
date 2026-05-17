import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { DragDropContext } from '@hello-pangea/dnd'
import Column from './Column'
import TaskModal from './TaskModal'
import CreateColumnModal from './CreateColumnModal'
import { useWebSocket } from '../../context/WebSocketContext'
import { useBoards } from '../../context/BoardContext'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function Board() {
  const { boardId } = useParams()
  const { boards, setCurrentBoardId } = useBoards()
  const [columns, setColumns] = useState([])
  const [tasks, setTasks] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const { messages } = useWebSocket()
  const currentBoardId = boardId ? parseInt(boardId) : null

  useEffect(() => {
    if (currentBoardId) setCurrentBoardId(currentBoardId)
  }, [currentBoardId, setCurrentBoardId])

  const fetchData = useCallback(async () => {
    if (!currentBoardId) return
    try {
      const [colsRes, tasksRes] = await Promise.all([
        axios.get(`/api/columns?board_id=${currentBoardId}`),
        axios.get(`/api/tasks?board_id=${currentBoardId}`)
      ])
      setColumns(colsRes.data)
      const tasksByCol = {}
      tasksRes.data.forEach(t => {
        if (!tasksByCol[t.column_id]) tasksByCol[t.column_id] = []
        tasksByCol[t.column_id].push(t)
      })
      setTasks(tasksByCol)
    } catch (err) {
      toast.error('Ошибка загрузки данных')
    }
  }, [currentBoardId])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (messages.length && currentBoardId) {
      const last = messages[messages.length - 1]
      if (['task_created', 'task_updated', 'task_deleted'].includes(last.type)) {
        fetchData()
      }
    }
  }, [messages, fetchData, currentBoardId])

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const taskId = parseInt(draggableId)
    const sourceColId = parseInt(source.droppableId)
    const destColId = parseInt(destination.droppableId)

    const sourceTasks = Array.from(tasks[sourceColId] || [])
    const movedTask = sourceTasks.find(t => t.id === taskId)
    if (!movedTask) return
    sourceTasks.splice(source.index, 1)

    const destTasks = sourceColId === destColId ? sourceTasks : Array.from(tasks[destColId] || [])
    const newTask = { ...movedTask, column_id: destColId }
    destTasks.splice(destination.index, 0, newTask)

    setTasks(prev => ({
      ...prev,
      [sourceColId]: sourceTasks,
      [destColId]: destTasks
    }))

    try {
      await axios.put(`/api/tasks/${taskId}`, { column_id: destColId })
    } catch (err) {
      toast.error('Ошибка перемещения')
      fetchData()
    }
  }

  if (!currentBoardId && boards.length === 0) {
    return <div style={{ padding: 40 }}>Создайте первую доску через боковое меню</div>
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px' }}>
        <h2>{boards.find(b => b.id === currentBoardId)?.name || 'Доска'}</h2>
        <button className="header-btn" onClick={() => setShowAddColumn(true)}>+ Колонка</button>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board">
          {columns.map(col => (
            <Column
              key={col.id}
              column={col}
              tasks={tasks[col.id] || []}
              onAddTask={() => {
                setEditingTask(null)
                setModalOpen({ columnId: col.id })
              }}
              onTaskClick={(task) => {
                setEditingTask(task)
                setModalOpen({ columnId: task.column_id })
              }}
            />
          ))}
        </div>
      </DragDropContext>
      {modalOpen && (
        <TaskModal
          columnId={modalOpen.columnId}
          task={editingTask}
          boardId={currentBoardId}
          onClose={() => setModalOpen(null)}
          onSaved={() => { setModalOpen(null); fetchData() }}
        />
      )}
      {showAddColumn && (
        <CreateColumnModal
          boardId={currentBoardId}
          onClose={() => setShowAddColumn(false)}
          onCreated={() => { setShowAddColumn(false); fetchData() }}
        />
      )}
    </>
  )
}