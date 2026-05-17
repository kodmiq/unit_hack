package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"dodirtim-backend/database"
	"dodirtim-backend/models"

	"github.com/gin-gonic/gin"
)

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

	var board models.Board
	if database.DB.First(&board, task.BoardID).Error == nil {
		notifyBoard(task.BoardID, fmt.Sprintf("На доске «%s» добавлена задача «%s», дата %s",
			board.Name, task.Title, time.Now().Format("02.01.2006 15:04")), 0)

		if task.Deadline != nil {
			timeToDeadline := time.Until(*task.Deadline)
			if timeToDeadline <= 24*time.Hour && timeToDeadline > 0 {
				notifyBoard(task.BoardID, fmt.Sprintf("До дедлайна задачи «%s» осталось менее 24 часов", task.Title), 0)
			}
		}
	}

	broadcastEvent("task_created", task)
	c.JSON(http.StatusCreated, task)
}

func UpdateTask(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var oldTask models.Task
	if err := database.DB.First(&oldTask, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Задача не найдена"})
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Model(&oldTask).Updates(input)

	var task models.Task
	database.DB.First(&task, id)

	if input["column_id"] != nil {
		newColumnID, ok := input["column_id"].(float64)
		if ok && uint(newColumnID) != oldTask.ColumnID {
			var newColumn models.Column
			if err := database.DB.First(&newColumn, uint(newColumnID)).Error; err == nil {
				var notifMsg string
				if newColumn.Title == "Done" {
					notifMsg = fmt.Sprintf("Задача «%s» завершена ✅", task.Title)
				} else {
					notifMsg = fmt.Sprintf("Задача «%s» перемещена в колонку «%s»", task.Title, newColumn.Title)
				}
				notifyBoard(task.BoardID, notifMsg, 0)
			}
		}
	}

	if input["deadline"] != nil {
		deadlineStr, ok := input["deadline"].(string)
		if ok {
			deadline, err := time.Parse(time.RFC3339, deadlineStr)
			if err == nil {
				timeToDeadline := time.Until(deadline)
				if timeToDeadline <= 24*time.Hour && timeToDeadline > 0 {
					notifyBoard(task.BoardID, fmt.Sprintf("До дедлайна задачи «%s» осталось менее 24 часов", task.Title), 0)
				}
			}
		}
	} else if oldTask.Deadline != nil {
		timeToDeadline := time.Until(*oldTask.Deadline)
		if timeToDeadline <= 24*time.Hour && timeToDeadline > 0 {
			notifyBoard(task.BoardID, fmt.Sprintf("До дедлайна задачи «%s» осталось менее 24 часов", task.Title), 0)
		}
	}

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
	userID := c.GetUint("userID")
	var board models.Board
	if database.DB.First(&board, task.BoardID).Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка"})
		return
	}
	if board.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "недостаточно прав"})
		return
	}
	database.DB.Delete(&task)
	broadcastEvent("task_deleted", map[string]uint{"id": task.ID})
	c.Status(http.StatusNoContent)
}

func notifyBoard(boardID uint, message string, excludeUserID uint) {
	var userIDs []uint
	var board models.Board
	if database.DB.First(&board, boardID).Error == nil {
		if board.OwnerID != excludeUserID {
			userIDs = append(userIDs, board.OwnerID)
		}
	}
	var members []models.BoardMember
	database.DB.Where("board_id = ?", boardID).Find(&members)
	for _, m := range members {
		if m.UserID != excludeUserID {
			userIDs = append(userIDs, m.UserID)
		}
	}
	seen := map[uint]bool{}
	var unique []uint
	for _, uid := range userIDs {
		if !seen[uid] {
			seen[uid] = true
			unique = append(unique, uid)
		}
	}
	for _, uid := range unique {
		notif := models.Notification{
			UserID:  uid,
			BoardID: boardID,
			Message: message,
		}
		database.DB.Create(&notif)
		if hub != nil {
			msg, _ := json.Marshal(map[string]interface{}{
				"type":         "notification_new",
				"notification": notif,
			})
			hub.SendToUser(uid, msg)
		}
	}
}
