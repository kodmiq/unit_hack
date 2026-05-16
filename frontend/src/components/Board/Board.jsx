import { useState, useEffect, useCallback } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import Column from './Column'
import TaskModal from './TaskModal'
import { useWebSocket } from '../../context/WebSocketContext'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function Board() {
  const [columns, setColumns] = useState([])
  const [tasks, setTasks] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const { messages } = useWebSocket()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [colsRes, tasksRes] = await Promise.all([
        axios.get('/api/columns'),
        axios.get('/api/tasks')
      ])
      const cols = colsRes.data
      const tasksByColumn = {}
      tasksRes.data.forEach(task => {
        const colId = task.column_id
        if (!tasksByColumn[colId]) tasksByColumn[colId] = []
        tasksByColumn[colId].push(task)
      })
      setColumns(cols)
      setTasks(tasksByColumn)
    } catch (err) {
      console.error('Ошибка загрузки данных', err)
      toast.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (['task_created', 'task_updated', 'task_deleted', 'task_moved'].includes(lastMsg.type)) {
      fetchData()
    }
  }, [messages, fetchData])

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

    const newTasks = { ...tasks, [sourceColId]: sourceTasks }
    if (sourceColId !== destColId) newTasks[destColId] = destTasks
    setTasks(newTasks)

    try {
      await axios.put(`/api/tasks/${taskId}`, { column_id: destColId })
      toast.success('Задача перемещена')
    } catch (err) {
      toast.error('Ошибка перемещения')
      fetchData()
    }
  }

  if (loading) {
    return <div style={{ padding: 40, fontSize: 18 }}>Загрузка доски...</div>
  }

  return (
    <>
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
          onClose={() => setModalOpen(null)}
          onSaved={() => {
            setModalOpen(null)
            fetchData()
          }}
        />
      )}
    </>
  )
}