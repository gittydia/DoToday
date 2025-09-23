package repositories

import (
	"DoToday/models"
	"database/sql"
)

type FeedRepository struct {
	db *sql.DB
}

func NewFeedRepository(db *sql.DB) *FeedRepository {
	return &FeedRepository{db: db}
}

func (r *FeedRepository) Create(feed *models.Feed) error {
	query := `
		INSERT INTO feeds (id, goal_id, date, description)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (goal_id, date) DO NOTHING
	`
	_, err := r.db.Exec(query, feed.ID, feed.GoalID, feed.Date, feed.Description)
	return err
}

func (r *FeedRepository) GetByGoalID(goalID string) ([]*models.Feed, error) {
	query := `
		SELECT id, goal_id, date, description
		FROM feeds
		WHERE goal_id = $1
		ORDER BY date DESC
	`
	rows, err := r.db.Query(query, goalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feeds []*models.Feed
	for rows.Next() {
		feed := &models.Feed{}
		err := rows.Scan(&feed.ID, &feed.GoalID, &feed.Date, &feed.Description)
		if err != nil {
			return nil, err
		}
		feeds = append(feeds, feed)
	}
	return feeds, nil
}

func (r *FeedRepository) GetByID(id string) (*models.Feed, error) {
	feed := &models.Feed{}
	query := `
		SELECT id, goal_id, date, description
		FROM feeds
		WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(&feed.ID, &feed.GoalID, &feed.Date, &feed.Description)
	if err != nil {
		return nil, err
	}
	return feed, nil
}
