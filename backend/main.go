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
	database.Connect()

	database.DB.AutoMigrate(
		&models.User{},
		&models.Board{},
		&models.Column{},
		&models.Task{},
	)

	hub := ws.NewHub()
	go hub.Run()

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	auth := r.Group("/api/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}

	api := r.Group("/api", middleware.AuthRequired())
	{
		// Доски
		api.POST("/boards", handlers.CreateBoard)
		api.GET("/boards", handlers.GetBoards)
		api.PUT("/boards/:id", handlers.UpdateBoard)
		api.DELETE("/boards/:id", handlers.DeleteBoard)

		// Колонки
		api.GET("/columns", handlers.GetColumns) // ?board_id=
		api.POST("/columns", handlers.CreateColumn)
		api.PUT("/columns/:id", handlers.UpdateColumn)
		api.DELETE("/columns/:id", handlers.DeleteColumn)

		// Задачи
		api.GET("/tasks", handlers.GetTasks) // ?board_id=
		api.POST("/tasks", handlers.CreateTask)
		api.PUT("/tasks/:id", handlers.UpdateTask)
		api.DELETE("/tasks/:id", handlers.DeleteTask)
	}

	r.GET("/ws", func(c *gin.Context) {
		handlers.WebSocketHandler(c, hub)
	})

	r.Run(":8080")
}
