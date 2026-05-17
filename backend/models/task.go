package models

import "time"

type Task struct {
	ID          uint       `json:"id" gorm:"primarykey"`
	Title       string     `json:"title" gorm:"not null"`
	Description string     `json:"description"`
	Priority    string     `json:"priority" gorm:"default:'medium'"`
	Deadline    *time.Time `json:"deadline"`
	Tags        string     `json:"tags"`
	ColumnID    uint       `json:"column_id" gorm:"not null"`
	Position    int        `json:"position" gorm:"default:0"`
	BoardID     uint       `json:"board_id" gorm:"not null"`
	CreatedAt   time.Time  `json:"created_at"`
	Column      Column     `json:"-" gorm:"foreignKey:ColumnID"`
}
