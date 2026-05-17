package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"dodirtim-backend/database"
	"dodirtim-backend/models"

	"github.com/gin-gonic/gin"
)

func InviteToBoard(c *gin.Context) {
	boardIDStr := c.Param("id")
	boardID, err := strconv.ParseUint(boardIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный id"})
		return
	}
	userID := c.GetUint("userID")

	var board models.Board
	if err := database.DB.First(&board, boardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "доска не найдена"})
		return
	}
	if board.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "нет прав"})
		return
	}

	var input struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var invitedUser models.User
	if err := database.DB.Where("email = ?", input.Email).First(&invitedUser).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "пользователь не найден"})
		return
	}

	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", boardID, invitedUser.ID).First(&member).Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "уже участник"})
		return
	}

	var existingInv models.Invitation
	if database.DB.Where("board_id = ? AND email = ? AND status = 'pending'", boardID, input.Email).First(&existingInv).Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "приглашение уже отправлено"})
		return
	}

	inv := models.Invitation{
		BoardID: uint(boardID),
		Email:   input.Email,
		Status:  "pending",
	}
	database.DB.Create(&inv)

	if hub != nil {
		msg, _ := json.Marshal(map[string]interface{}{
			"type":       "invitation_created",
			"invitation": inv,
		})
		hub.SendToUser(invitedUser.ID, msg)
	}

	c.JSON(http.StatusCreated, gin.H{"invitation": inv})
}

func GetInvitations(c *gin.Context) {
	userID := c.GetUint("userID")
	var user models.User
	database.DB.First(&user, userID)
	var invitations []models.Invitation
	database.DB.Preload("Board").Where("email = ? AND status = 'pending'", user.Email).Find(&invitations)
	c.JSON(http.StatusOK, invitations)
}

func AcceptInvitation(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 64)
	userID := c.GetUint("userID")

	var inv models.Invitation
	if database.DB.First(&inv, id).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "приглашение не найдено"})
		return
	}
	var user models.User
	database.DB.First(&user, userID)
	if inv.Email != user.Email {
		c.JSON(http.StatusForbidden, gin.H{"error": "не ваше приглашение"})
		return
	}

	inv.Status = "accepted"
	database.DB.Save(&inv)

	member := models.BoardMember{
		BoardID: inv.BoardID,
		UserID:  userID,
		Role:    "member",
	}
	database.DB.Create(&member)

	c.JSON(http.StatusOK, gin.H{"status": "accepted"})

	var board models.Board
	database.DB.First(&board, inv.BoardID)
	notifyBoard(board.ID, fmt.Sprintf("Пользователь %s принял приглашение в доску «%s»", user.Username, board.Name), 0)
}

func DeclineInvitation(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 64)
	userID := c.GetUint("userID")

	var inv models.Invitation
	if database.DB.First(&inv, id).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "приглашение не найдено"})
		return
	}
	var user models.User
	database.DB.First(&user, userID)
	if inv.Email != user.Email {
		c.JSON(http.StatusForbidden, gin.H{"error": "не ваше приглашение"})
		return
	}
	inv.Status = "declined"
	database.DB.Save(&inv)
	c.JSON(http.StatusOK, gin.H{"status": "declined"})

	var board models.Board
	database.DB.First(&board, inv.BoardID)
	notifyBoard(board.ID, fmt.Sprintf("Пользователь %s отклонил приглашение в доску «%s»", user.Username, board.Name), 0)
}
