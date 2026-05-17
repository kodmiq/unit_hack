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
		&models.BoardMember{},
		&models.Invitation{},
		&models.Notification{},
	)

	hub := ws.NewHub()
	go hub.Run()
	handlers.SetHub(hub) // обязательно

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
		api.POST("/boards", handlers.CreateBoard)
		api.GET("/boards", handlers.GetBoards)
		api.PUT("/boards/:id", handlers.UpdateBoard)
		api.DELETE("/boards/:id", handlers.DeleteBoard)

		api.GET("/columns", handlers.GetColumns)
		api.POST("/columns", handlers.CreateColumn)
		api.PUT("/columns/:id", handlers.UpdateColumn)
		api.DELETE("/columns/:id", handlers.DeleteColumn)

		api.GET("/tasks", handlers.GetTasks)
		api.POST("/tasks", handlers.CreateTask)
		api.PUT("/tasks/:id", handlers.UpdateTask)
		api.DELETE("/tasks/:id", handlers.DeleteTask)

		api.POST("/boards/:id/invite", handlers.InviteToBoard)
		api.GET("/invitations", handlers.GetInvitations)
		api.PUT("/invitations/:id/accept", handlers.AcceptInvitation)
		api.PUT("/invitations/:id/decline", handlers.DeclineInvitation)

		api.DELETE("/boards/:id/members/:memberId", handlers.RemoveMember)

		api.GET("/boards/:id/members", handlers.GetBoardMembers)
		api.GET("/notifications", handlers.GetNotifications)
		api.GET("/notifications/count-unread", handlers.CountUnread)
		api.PUT("/notifications/read-all", handlers.MarkAllRead)
	}

	r.GET("/ws", func(c *gin.Context) {
		handlers.WebSocketHandler(c, hub)
	})

	r.Run(":8080")
}
