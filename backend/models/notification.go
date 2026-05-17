package models

import "time"

type Notification struct {
	ID        uint      `json:"id" gorm:"primarykey"`
	UserID    uint      `json:"user_id" gorm:"not null"`
	BoardID   uint      `json:"board_id" gorm:"not null"`
	Message   string    `json:"message" gorm:"not null"`
	Read      bool      `json:"read" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`
}
