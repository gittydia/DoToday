package handlers

import (
	"DoToday/models"
	"DoToday/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type FeedHandler struct {
	feedService *services.FeedService
}

func NewFeedHandler(feedService *services.FeedService) *FeedHandler {
	return &FeedHandler{feedService: feedService}
}

func (h *FeedHandler) CreateFeed(c *gin.Context) {
	var req models.Feed
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.feedService.CreateFeed(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, req)
}

func (h *FeedHandler) GetFeedByID(c *gin.Context) {
	id := c.Param("id")
	feed, err := h.feedService.GetFeedByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Feed not found"})
		return
	}
	c.JSON(http.StatusOK, feed)
}

func (h *FeedHandler) GetFeedsByGoalID(c *gin.Context) {
	goalID := c.Param("goal_id")
	feeds, err := h.feedService.GetFeedsByGoalID(goalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, feeds)
}
