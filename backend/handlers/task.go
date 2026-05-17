package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"dodirtim-backend/database"
	"dodirtim-backend/models"
	"dodirtim-backend/ws"

	"github.com/gin-gonic/gin"
)

var hub *ws.Hub

func SetHub(h *ws.Hub) {
	hub = h
}

func broadcastEvent(eventType string, task interface{}) {
	if hub == nil {
		return
	}
	data, err := json.Marshal(map[string]interface{}{
		"type": eventType,
		"task": task,
	})
	if err != nil {
		return
	}
	hub.Broadcast(data)
}

func GetTasks(c *gin.Context) {
	boardIDStr := c.Query("board_id")
	if boardIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "board_id required"})
		return
	}
	boardID, _ := strconv.ParseUint(boardIDStr, 10, 64)
	var tasks []models.Task
	database.DB.Where("board_id = ?", boardID).Order("position asc").Find(&tasks)
	c.JSON(http.StatusOK, tasks)
}

func CreateTask(c *gin.Context) {
	var task models.Task
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var maxPos *int
	database.DB.Model(&models.Task{}).Where("column_id = ?", task.ColumnID).Select("max(position)").Scan(&maxPos)
	if maxPos != nil {
		task.Position = *maxPos + 1
	}
	database.DB.Create(&task)
	broadcastEvent("task_created", task)
	c.JSON(http.StatusCreated, task)
}

func UpdateTask(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var task models.Task
	if err := database.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Задача не найдена"})
		return
	}
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Model(&task).Updates(input)
	broadcastEvent("task_updated", task)
	c.JSON(http.StatusOK, task)
}

func DeleteTask(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var task models.Task
	if err := database.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Задача не найдена"})
		return
	}
	database.DB.Delete(&task)
	broadcastEvent("task_deleted", map[string]uint{"id": task.ID})
	c.Status(http.StatusNoContent)
}
