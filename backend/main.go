package main

import (
	"dodirtim-backend/database"
	"dodirtim-backend/handlers"
	"dodirtim-backend/middleware"
	"dodirtim-backend/models"
	"dodirtim-backend/ws"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Подключаемся к базе
	database.Connect()

	// Автомиграция таблиц
	database.DB.AutoMigrate(
		&models.User{},
		&models.Column{},
		&models.Task{},
	)

	// Создаём колонки по умолчанию, если их нет
	seedColumns()

	// Запускаем WebSocket-хаб
	hub := ws.NewHub()
	go hub.Run()

	// Настраиваем роутер
	r := gin.Default()

	// CORS для разработки (фронтенд на localhost:5173)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Публичные маршруты
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}

	// Защищённые маршруты
	api := r.Group("/api", middleware.AuthRequired())
	{
		api.GET("/columns", handlers.GetColumns)
		api.POST("/columns", handlers.CreateColumn)
		api.PUT("/columns/:id", handlers.UpdateColumn)
		api.DELETE("/columns/:id", handlers.DeleteColumn)

		api.GET("/tasks", handlers.GetTasks)
		api.POST("/tasks", handlers.CreateTask)
		api.PUT("/tasks/:id", handlers.UpdateTask)
		api.DELETE("/tasks/:id", handlers.DeleteTask)
	}

	// WebSocket endpoint (защищён токеном в query параметре)
	r.GET("/ws", func(c *gin.Context) {
		handlers.WebSocketHandler(c, hub)
	})

	r.Run(":8080")
}

// seedColumns добавляет стандартные колонки, если их ещё нет
func seedColumns() {
	var count int64
	database.DB.Model(&models.Column{}).Count(&count)
	if count == 0 {
		columns := []models.Column{
			{Title: "To Do", Color: "#f2c94c", Position: 1},
			{Title: "In Progress", Color: "#5e6ad2", Position: 2},
			{Title: "Done", Color: "#6fcf97", Position: 3},
		}
		database.DB.Create(&columns)
	}
}
