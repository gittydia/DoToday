package handlers

import (
	"DoToday/models"
	"DoToday/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type LikeHandler struct {
	likeService *services.LikeService
}

func NewLikeHandler(likeService *services.LikeService) *LikeHandler {
	return &LikeHandler{likeService: likeService}
}

func (h *LikeHandler) CreateLike(c *gin.Context) {
	var req models.Like
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.likeService.CreateLike(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, req)
}

func (h *LikeHandler) DeleteLike(c *gin.Context) {
	feedID := c.Param("feed_id")
	userID := c.Query("user_id")
	if err := h.likeService.DeleteLike(feedID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Like deleted successfully"})
}

func (h *LikeHandler) CountLikes(c *gin.Context) {
	feedID := c.Param("feed_id")
	count, err := h.likeService.CountLikes(feedID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}

func (h *LikeHandler) Exists(c *gin.Context) {
	feedID := c.Param("feed_id")
	userID := c.Query("user_id")
	exists, err := h.likeService.Exists(feedID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"exists": exists})
}
