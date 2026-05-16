import { Droppable } from '@hello-pangea/dnd'
import Card from './Card'

export default function Column({ column, tasks, onAddTask, onTaskClick }) {
  const columnId = column?.id?.toString() || '0'

  return (
    <div className="column">
      <div className="column-header">
        <div className="column-title">
          <span className="column-dot" style={{ background: column?.color || '#ccc' }}></span>
          <h2>{column?.title || 'Без названия'}</h2>
          <span className="task-count">{tasks?.length || 0}</span>
        </div>
        <button className="add-task-btn" onClick={onAddTask}>+</button>
      </div>
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            className="task-list"
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              background: snapshot.isDraggingOver ? '#d3d9e2' : 'transparent',
              transition: 'background 0.2s',
            }}
          >
            {tasks?.map((task, index) => (
              <Card
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}