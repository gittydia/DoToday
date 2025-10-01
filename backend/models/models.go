package models

import (
	"time"
)

// profiles
type Profile struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"unique;not null"`
	Email     string    `json:"email" gorm:"unique;not null"`
	CreatedAt time.Time `json:"created_at"`
}

// goals
type Goal struct {
	ID            string        `json:"id" gorm:"primaryKey;default:gen_random_uuid()"`
	UserID        string        `json:"user_id" gorm:"not null"`
	Title         string        `json:"title" gorm:"not null"`
	Category      string        `json:"category" gorm:"not null"`
	Description   string        `json:"description"`
	Frequency     string        `json:"frequency" gorm:"default:'daily'"`
	TargetCount   int           `json:"target_count" gorm:"default:1"`
	Deadline      *time.Time    `json:"deadline"`
	IsPublic      bool          `json:"is_public" gorm:"default:false"`
	CurrentStreak int           `json:"current_streak" gorm:"default:0"`
	Archived      bool          `json:"archived" gorm:"default:false"`
	CreatedAt     time.Time     `json:"created_at"`
	Completions   []*Completion `json:"completions" gorm:"-"`
}

// completions
type Completion struct {
	ID        string    `json:"id" gorm:"primaryKey;default:gen_random_uuid()"`
	GoalID    string    `json:"goal_id" gorm:"not null"`
	Date      time.Time `json:"date" gorm:"not null"`
	Count     int       `json:"count" gorm:"default:1"`
	CreatedAt time.Time `json:"created_at"`
}

// feeds
type Feed struct {
	ID          string     `json:"id" gorm:"primaryKey;default:gen_random_uuid()"`
	GoalID      string     `json:"goal_id" gorm:"not null"`
	Date        *time.Time `json:"date"`
	Description string     `json:"description" gorm:"not null"`
}

// comments
type Comment struct {
	ID        string    `json:"id" gorm:"primaryKey;default:gen_random_uuid()"`
	FeedID    string    `json:"feed_id" gorm:"not null"`
	UserID    string    `json:"user_id" gorm:"not null"`
	Content   string    `json:"content" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
}

// likes
type Like struct {
	ID        string    `json:"id" gorm:"primaryKey;default:gen_random_uuid()"`
	FeedID    string    `json:"feed_id" gorm:"not null"`
	UserID    string    `json:"user_id" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
}

// user_stats view
type UserStats struct {
	UserID           string `json:"user_id"`
	TotalGoals       int    `json:"total_goals"`
	TotalCompletions int    `json:"total_completions"`
	LongestStreak    int    `json:"longest_streak"`
}

// CompletionGraphData is not part of the DB schema but may be used for analytics
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
	Category    string    `json:"category" binding:"required"`
	Description string    `json:"description"`
	Frequency   string    `json:"frequency"`
	TargetCount int       `json:"target_count"`
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
	Token string  `json:"token"`
	User  Profile `json:"user"`
}

type StreakResponse struct {
	CurrentStreak int `json:"current_streak"`
	LongestStreak int `json:"longest_streak"`
	Completions   int `json:"completions"`
}
