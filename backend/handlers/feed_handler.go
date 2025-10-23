package handlers

import (
	"DoToday/middleware"
	"DoToday/models"
	"DoToday/services"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	// Ensure we have an ID and date so returned object is useful even when not persisted
	if req.ID == "" {
		req.ID = uuid.NewString()
	}
	if req.Date == nil {
		now := time.Now()
		req.Date = &now
	}


	if uid, ok := middleware.GetUserID(c); ok {
		req.UserID = uid
	}

	// Skip persistence when FEED_PERSIST=false (useful during migrations or dev)
	if strings.ToLower(os.Getenv("FEED_PERSIST")) == "false" {
		// Return created feed object without saving to DB
		c.JSON(http.StatusCreated, req)
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

func (h *FeedHandler) GetAllFeeds(c *gin.Context) {
	feeds, err := h.feedService.GetAllFeeds()
	if err != nil {
		// log error server-side for debugging
		log.Printf("GetAllFeeds error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, feeds)
}
