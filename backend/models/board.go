package models

type Board struct {
	ID      uint   `json:"id" gorm:"primarykey"`
	Name    string `json:"name" gorm:"not null"`
	OwnerID uint   `json:"owner_id" gorm:"not null"`
	Owner   User   `json:"-" gorm:"foreignKey:OwnerID"`
}
