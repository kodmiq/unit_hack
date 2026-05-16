export default function Header() {
  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="project-name">Хакатон 2026</h1>
        <span className="breadcrumb">ДоДырТим / Проекты / Хакатон</span>
      </div>
      <div className="header-right">
        <button className="header-btn">🔍 Поиск</button>
        <button className="header-btn">📅 Календарь</button>
        <button className="header-btn">👥 Участники</button>
        <div className="avatar">😎</div>
      </div>
    </header>
  )
}