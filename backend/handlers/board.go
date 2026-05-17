package handlers

import (
	"net/http"
	"strconv"

	"dodirtim-backend/database"
	"dodirtim-backend/models"

	"github.com/gin-gonic/gin"
)

func CreateBoard(c *gin.Context) {
	userID := c.GetUint("userID")
	var input struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	board := models.Board{
		Name:    input.Name,
		OwnerID: userID,
	}
	database.DB.Create(&board)
	columns := []models.Column{
		{Title: "To Do", Color: "#f2c94c", Position: 1, BoardID: board.ID},
		{Title: "In Progress", Color: "#5e6ad2", Position: 2, BoardID: board.ID},
		{Title: "Done", Color: "#6fcf97", Position: 3, BoardID: board.ID},
	}
	database.DB.Create(&columns)
	c.JSON(http.StatusCreated, board)
}

func GetBoards(c *gin.Context) {
	userID := c.GetUint("userID")
	var owned []models.Board
	database.DB.Where("owner_id = ?", userID).Find(&owned)

	var memberIDs []uint
	database.DB.Model(&models.BoardMember{}).Where("user_id = ?", userID).Pluck("board_id", &memberIDs)

	var memberBoards []models.Board
	if len(memberIDs) > 0 {
		database.DB.Where("id IN ?", memberIDs).Find(&memberBoards)
	}

	allBoards := append(owned, memberBoards...)
	seen := map[uint]bool{}
	var result []models.Board
	for _, b := range allBoards {
		if !seen[b.ID] {
			seen[b.ID] = true
			result = append(result, b)
		}
	}
	c.JSON(http.StatusOK, result)
}

func UpdateBoard(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный id"})
		return
	}
	userID := c.GetUint("userID")
	var board models.Board
	if database.DB.First(&board, id).Error != nil || board.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "нет доступа"})
		return
	}
	var input struct {
		Name string `json:"name" binding:"required"`
	}
	if c.ShouldBindJSON(&input) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверные данные"})
		return
	}
	board.Name = input.Name
	database.DB.Save(&board)
	c.JSON(http.StatusOK, board)
}

func DeleteBoard(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный id"})
		return
	}
	userID := c.GetUint("userID")
	var board models.Board
	if err := database.DB.First(&board, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "доска не найдена"})
		return
	}
	if board.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "нет прав"})
		return
	}
	database.DB.Where("board_id = ?", board.ID).Delete(&models.Task{})
	database.DB.Where("board_id = ?", board.ID).Delete(&models.Column{})
	database.DB.Delete(&board)
	c.Status(http.StatusNoContent)
}

func GetColumns(c *gin.Context) {
	boardIDStr := c.Query("board_id")
	if boardIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "board_id обязателен"})
		return
	}
	boardID, _ := strconv.ParseUint(boardIDStr, 10, 64)
	var columns []models.Column
	database.DB.Where("board_id = ?", boardID).Order("position asc").Find(&columns)
	c.JSON(http.StatusOK, columns)
}

func CreateColumn(c *gin.Context) {
	userID := c.GetUint("userID")
	var col models.Column
	if err := c.ShouldBindJSON(&col); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var board models.Board
	if database.DB.First(&board, col.BoardID).Error != nil || board.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "нет доступа"})
		return
	}
	var maxPos *int
	database.DB.Model(&models.Column{}).Where("board_id = ?", col.BoardID).Select("max(position)").Scan(&maxPos)
	if maxPos != nil {
		col.Position = *maxPos + 1
	} else {
		col.Position = 1
	}
	database.DB.Create(&col)
	c.JSON(http.StatusCreated, col)
}

func UpdateColumn(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 64)
	userID := c.GetUint("userID")
	var col models.Column
	if database.DB.First(&col, id).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "колонка не найдена"})
		return
	}
	// Проверка доступа
	var board models.Board
	if database.DB.First(&board, col.BoardID).Error != nil || board.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "нет доступа"})
		return
	}
	var input struct {
		Title string `json:"title"`
		Color string `json:"color"`
	}
	c.ShouldBindJSON(&input)
	if input.Title != "" {
		col.Title = input.Title
	}
	if input.Color != "" {
		col.Color = input.Color
	}
	database.DB.Save(&col)
	c.JSON(http.StatusOK, col)
}

func DeleteColumn(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 64)
	userID := c.GetUint("userID")
	var col models.Column
	if database.DB.First(&col, id).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "колонка не найдена"})
		return
	}
	var board models.Board
	if database.DB.First(&board, col.BoardID).Error != nil || board.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "нет доступа"})
		return
	}
	database.DB.Where("column_id = ?", col.ID).Delete(&models.Task{})
	database.DB.Delete(&col)
	c.Status(http.StatusNoContent)
}

func GetBoardMembers(c *gin.Context) {
	boardIDStr := c.Param("id")
	boardID, err := strconv.ParseUint(boardIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный id"})
		return
	}
	userID := c.GetUint("userID")
	var board models.Board
	if database.DB.First(&board, boardID).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "доска не найдена"})
		return
	}
	isMember := board.OwnerID == userID || database.DB.Where("board_id = ? AND user_id = ?", boardID, userID).First(&models.BoardMember{}).Error == nil
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "нет доступа"})
		return
	}

	var members []models.BoardMember
	database.DB.Preload("User").Where("board_id = ?", boardID).Find(&members)

	owner := models.BoardMember{
		BoardID: board.ID,
		UserID:  board.OwnerID,
		Role:    "owner",
		User:    board.Owner,
	}
	var ownerUser models.User
	database.DB.First(&ownerUser, board.OwnerID)
	owner.User = ownerUser

	found := false
	for _, m := range members {
		if m.UserID == board.OwnerID {
			found = true
			break
		}
	}
	if !found {
		members = append([]models.BoardMember{owner}, members...)
	}

	c.JSON(http.StatusOK, members)
}
