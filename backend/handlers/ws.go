package handlers

import (
	"net/http"
	"strings"

	"dodirtim-backend/middleware"
	"dodirtim-backend/ws"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func WebSocketHandler(c *gin.Context, hub *ws.Hub) {
	SetHub(hub)

	// Получаем токен из query-параметра
	tokenString := c.Query("token")
	if tokenString == "" {
		// Пробуем получить из заголовка Authorization (для случаев, когда клиент шлёт через заголовок)
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}
	if tokenString == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Токен не предоставлен"})
		return
	}

	// Парсим JWT
	claims := &middleware.Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		return middleware.JwtKey, nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Невалидный токен"})
		return
	}

	// Апгрейд до WebSocket
	conn, err := ws.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	client := ws.NewClient(hub, conn, claims.UserID)
	hub.Register <- client
	go client.WritePump()
	go client.ReadPump()
}