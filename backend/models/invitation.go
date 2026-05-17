package models

import "time"

type Invitation struct {
	ID        uint      `json:"id" gorm:"primarykey"`
	BoardID   uint      `json:"board_id" gorm:"not null"`
	Email     string    `json:"email" gorm:"not null"`
	Status    string    `json:"status" gorm:"default:'pending'"`
	CreatedAt time.Time `json:"created_at"`
	Board     Board     `json:"board" gorm:"foreignKey:BoardID"`
}
