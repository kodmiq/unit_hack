package handlers

import (
	"net/http"

	"dodirtim-backend/middleware"
	"dodirtim-backend/ws"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func WebSocketHandler(c *gin.Context, hub *ws.Hub) {
	SetHub(hub)

	tokenString := c.Query("token")
	if tokenString == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Токен не предоставлен"})
		return
	}

	claims := &middleware.Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		return middleware.JwtKey, nil
	})
	if err != nil || !token.Valid {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Невалидный токен"})
		return
	}

	conn, err := ws.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	client := ws.NewClient(hub, conn, claims.UserID)
	hub.Register <- client
	go client.WritePump()
	go client.ReadPump()
}
