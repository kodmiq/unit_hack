package database

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := "host=localhost user=kanban_user password=123 dbname=kanbandb port=5433 sslmode=disable TimeZone=Europe/Moscow"
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Не удалось подключиться к базе данных:", err)
	}
	fmt.Println("Подключение к PostgreSQL успешно")
}
