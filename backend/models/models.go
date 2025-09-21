package models

import (
	"time"

	"github.com/google/uuid"
)

// Core Models
type User struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Password  string    `json:"-"` 
	CreatedAt time.Time `json:"created_at"`
}

type UserStats struct {
	UserID           uuid.UUID `json:"user_id"`
	TotalGoals       int       `json:"total_goals"`
	CompletedGoals   int       `json:"completed_goals"`
	CurrentStreak    int       `json:"current_streak"`
	LongestStreak    int       `json:"longest_streak"`
	CompletionRate   int       `json:"completion_rate"`
	TotalCompletions int       `json:"total_completions"`
}

type Goal struct {
	ID            uuid.UUID `json:"id"`
	UserID        uuid.UUID `json:"user_id"`
	Username      string    `json:"username"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	Deadline      time.Time `json:"deadline"`
	IsPublic      bool      `json:"is_public"`
	CurrentStreak int       `json:"current_streak"`
	Archived      bool      `json:"archived"`
	CreatedAt     time.Time `json:"created_at"`
}

type Completion struct {
	ID        uuid.UUID `json:"id"`
	GoalID    uuid.UUID `json:"goal_id"`
	Date      time.Time `json:"date"`
	CreatedAt time.Time `json:"created_at"`
}

type CompletionGraphData struct {
	Date        time.Time `json:"date"`
	Completions int       `json:"completions"`
	Count       int       `json:"count"`
}

// Request Models
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type CreateGoalRequest struct {
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description"`
	Deadline    time.Time `json:"deadline"`
	IsPublic    bool      `json:"is_public"`
}

type UpdateGoalRequest struct {
	Title       *string    `json:"title,omitempty"`
	Description *string    `json:"description,omitempty"`
	Deadline    *time.Time `json:"deadline,omitempty"`
	IsPublic    *bool      `json:"is_public,omitempty"`
	Archived    *bool      `json:"archived,omitempty"`
}

type UpdateProfileRequest struct {
	Username    *string `json:"username,omitempty"`
	NewPassword *string `json:"new_password,omitempty"`
}

// Response Models
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type StreakResponse struct {
	CurrentStreak int `json:"current_streak"`
	LongestStreak int `json:"longest_streak"`
	Completions   int `json:"completions"`
}
