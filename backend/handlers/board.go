package handlers

import (
	"net/http"
	"strconv"

	"dodirtim-backend/database"
	"dodirtim-backend/models"

	"github.com/gin-gonic/gin"
)

func GetColumns(c *gin.Context) {
	var columns []models.Column
	database.DB.Order("position asc").Find(&columns)
	c.JSON(http.StatusOK, columns)
}

func CreateColumn(c *gin.Context) {
	var col models.Column
	if err := c.ShouldBindJSON(&col); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Create(&col)
	c.JSON(http.StatusCreated, col)
}

func UpdateColumn(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var col models.Column
	if err := database.DB.First(&col, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Колонка не найдена"})
		return
	}
	if err := c.ShouldBindJSON(&col); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Save(&col)
	c.JSON(http.StatusOK, col)
}

func DeleteColumn(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	database.DB.Delete(&models.Column{}, id)
	// Также удаляем все задачи в этой колонке
	database.DB.Where("column_id = ?", id).Delete(&models.Task{})
	c.Status(http.StatusNoContent)
}
