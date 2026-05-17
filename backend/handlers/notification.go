package handlers

import (
	"dodirtim-backend/database"
	"dodirtim-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetNotifications(c *gin.Context) {
	userID := c.GetUint("userID")
	var notifications []models.Notification
	database.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&notifications)
	c.JSON(http.StatusOK, notifications)
}

func CountUnread(c *gin.Context) {
	userID := c.GetUint("userID")
	var count int64
	database.DB.Model(&models.Notification{}).Where("user_id = ? AND read = false", userID).Count(&count)
	c.JSON(http.StatusOK, gin.H{"count": count})
}

func MarkAllRead(c *gin.Context) {
	userID := c.GetUint("userID")
	database.DB.Model(&models.Notification{}).Where("user_id = ? AND read = false", userID).Update("read", true)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
