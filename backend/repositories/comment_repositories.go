package repositories

import (
	"DoToday/models"
	"database/sql"
)

type CommentRepository struct {
	db *sql.DB
}

func NewCommentRepository(db *sql.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

func (r *CommentRepository) Create(comment *models.Comment) error {
	query := `
		INSERT INTO comments (id, feed_id, user_id, content, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.db.Exec(query, comment.ID, comment.FeedID, comment.UserID, comment.Content, comment.CreatedAt)
	return err
}

func (r *CommentRepository) GetByFeedID(feedID string) ([]*models.Comment, error) {
	query := `
		SELECT id, feed_id, user_id, content, created_at
		FROM comments
		WHERE feed_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(query, feedID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []*models.Comment
	for rows.Next() {
		comment := &models.Comment{}
		err := rows.Scan(&comment.ID, &comment.FeedID, &comment.UserID, &comment.Content, &comment.CreatedAt)
		if err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}
	return comments, nil
}

func (r *CommentRepository) Delete(id, userID string) error {
	query := `DELETE FROM comments WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, id, userID)
	return err
}
