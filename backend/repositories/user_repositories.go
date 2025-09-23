// repositories/user_repository.go
package repositories

import (
	"DoToday/models"
	"database/sql"

	"github.com/google/uuid"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(profile *models.Profile) error {
	query := `
	       INSERT INTO profiles (id, username, email, created_at)
	       VALUES ($1, $2, $3, $4)
       `
	_, err := r.db.Exec(query, profile.ID, profile.Username, profile.Email, profile.CreatedAt)
	return err
}

func (r *UserRepository) GetByID(id string) (*models.Profile, error) {
	profile := &models.Profile{}
	query := `
	       SELECT id, username, email, created_at
	       FROM profiles
	       WHERE id = $1
       `
	err := r.db.QueryRow(query, id).Scan(
		&profile.ID, &profile.Username, &profile.Email, &profile.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return profile, nil
}

func (r *UserRepository) GetByUsername(username string) (*models.Profile, error) {
	profile := &models.Profile{}
	query := `
	       SELECT id, username, email, created_at
	       FROM profiles
	       WHERE username = $1
       `
	err := r.db.QueryRow(query, username).Scan(
		&profile.ID, &profile.Username, &profile.Email, &profile.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return profile, nil
}

func (r *UserRepository) UpdateUsername(id string, username string) error {
	query := `
	       UPDATE profiles
	       SET username = $1
	       WHERE id = $2
       `
	_, err := r.db.Exec(query, username, id)
	return err
}

func (r *UserRepository) GetStats(id uuid.UUID) (*models.UserStats, error) {
	stats := &models.UserStats{}
	query := `
		SELECT user_id, total_goals, total_completions, longest_streak
		FROM user_stats
		WHERE user_id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&stats.UserID, &stats.TotalGoals, &stats.TotalCompletions, &stats.LongestStreak,
	)
	if err != nil {
		return nil, err
	}
	return stats, nil
}
