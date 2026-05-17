package handlers

import (
	"net/http"
	"strconv"

	"dodirtim-backend/database"
	"dodirtim-backend/models"

	"github.com/gin-gonic/gin"
)

func RemoveMember(c *gin.Context) {
	boardIDStr := c.Param("id")
	memberIDStr := c.Param("memberId")
	boardID, _ := strconv.ParseUint(boardIDStr, 10, 64)
	memberID, _ := strconv.ParseUint(memberIDStr, 10, 64)

	userID := c.GetUint("userID")
	var board models.Board
	if database.DB.First(&board, boardID).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "доска не найдена"})
		return
	}
	if board.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "нет прав"})
		return
	}
	if uint(memberID) == board.OwnerID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "нельзя удалить владельца"})
		return
	}

	result := database.DB.Where("board_id = ? AND user_id = ?", boardID, memberID).Delete(&models.BoardMember{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "участник не найден"})
		return
	}
	c.Status(http.StatusNoContent)
}
