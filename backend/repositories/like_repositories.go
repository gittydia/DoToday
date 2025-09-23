package repositories

import (
	"DoToday/models"
	"database/sql"
)

type LikeRepository struct {
	db *sql.DB
}

func NewLikeRepository(db *sql.DB) *LikeRepository {
	return &LikeRepository{db: db}
}

func (r *LikeRepository) Create(like *models.Like) error {
	query := `
		INSERT INTO likes (id, feed_id, user_id, created_at)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (feed_id, user_id) DO NOTHING
	`
	_, err := r.db.Exec(query, like.ID, like.FeedID, like.UserID, like.CreatedAt)
	return err
}

func (r *LikeRepository) Delete(feedID, userID string) error {
	query := `DELETE FROM likes WHERE feed_id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, feedID, userID)
	return err
}

func (r *LikeRepository) Count(feedID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM likes WHERE feed_id = $1`
	err := r.db.QueryRow(query, feedID).Scan(&count)
	return count, err
}

func (r *LikeRepository) Exists(feedID, userID string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM likes WHERE feed_id = $1 AND user_id = $2)`
	err := r.db.QueryRow(query, feedID, userID).Scan(&exists)
	return exists, err
}
