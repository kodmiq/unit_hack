import { Draggable } from '@hello-pangea/dnd'

export default function Card({ task, index, onClick }) {
  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          className="card"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.8 : 1,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} rotate(3deg)`
              : provided.draggableProps.style?.transform,
          }}
        >
          <div className="card-labels">
            {task.tags && task.tags.split(',').map(tag => (
              <span key={tag} className="card-label" style={{ background: getTagColor(tag.trim()) }}>
                {tag.trim()}
              </span>
            ))}
          </div>
          <h3 className="card-title">{task.title}</h3>
          <div className="card-footer">
            <span className="card-date">
              {task.deadline ? new Date(task.deadline).toLocaleDateString() : ''}
            </span>
            <span className={`priority priority-${task.priority || 'medium'}`}>
              {task.priority || 'medium'}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  )
}

function getTagColor(tag) {
  const colors = {
    'bug': '#eb5a46',
    'feature': '#0079bf',
    'improvement': '#6fcf97',
    'design': '#c377e0',
    'documentation': '#f2d600',
    'urgent': '#ff0000'
  }
  return colors[tag] || '#8898aa'
}