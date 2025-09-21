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

func (r *UserRepository) Create(user *models.User) error {
	query := `
		INSERT INTO profiles (id, username, email, password, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.db.Exec(query, user.ID, user.Username, user.Email, user.Password, user.CreatedAt)
	return err
}

func (r *UserRepository) GetByID(id uuid.UUID) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, username, email, password, created_at
		FROM profiles
		WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) GetByUsername(username string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, username, email, password, created_at
		FROM profiles
		WHERE username = $1
	`
	err := r.db.QueryRow(query, username).Scan(
		&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) UpdateUsername(id uuid.UUID, username string) error {
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
