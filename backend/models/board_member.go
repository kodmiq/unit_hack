package models

type BoardMember struct {
	ID      uint   `json:"id" gorm:"primarykey"`
	BoardID uint   `json:"board_id" gorm:"not null"`
	UserID  uint   `json:"user_id" gorm:"not null"`
	Role    string `json:"role" gorm:"default:'member'"`
	Board   Board  `json:"-" gorm:"foreignKey:BoardID"`
	User    User   `json:"user" gorm:"foreignKey:UserID"`
}
