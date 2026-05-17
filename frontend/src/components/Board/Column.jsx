import { Droppable } from '@hello-pangea/dnd'
import Card from './Card'

export default function Column({ column, tasks, onAddTask, onTaskClick, onDeleteColumn }) {
  return (
    <div className="column">
      <div className="column-header">
        <div className="column-title">
          <span className="column-dot" style={{ background: column.color }}></span>
          <h2>{column.title}</h2>
          <span className="task-count">{tasks.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {onDeleteColumn && (
            <button className="add-task-btn" onClick={onDeleteColumn} title="Удалить колонку">🗑</button>
          )}
          <button className="add-task-btn" onClick={onAddTask}>+</button>
        </div>
      </div>
      <Droppable droppableId={column.id.toString()}>
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
            {tasks.map((task, index) => (
              <Card key={task.id} task={task} index={index} onClick={() => onTaskClick(task)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}