package models

type Column struct {
	ID       uint   `json:"id" gorm:"primarykey"`
	Title    string `json:"title" gorm:"not null"`
	Color    string `json:"color" gorm:"default:'#b3b3b3'"`
	Position int    `json:"position" gorm:"default:0"`
	BoardID  uint   `json:"board_id" gorm:"not null"`
	Board    Board  `json:"-" gorm:"foreignKey:BoardID"`
}
