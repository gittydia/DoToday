package repositories

import (
	"DoToday/models"
	"database/sql"
	"fmt"
	"time"
)

type CompletionRepository struct {
	db *sql.DB
}

func NewCompletionRepository(db *sql.DB) *CompletionRepository {
	return &CompletionRepository{db: db}
}

func (r *CompletionRepository) Create(completion *models.Completion) error {
	query := `
	       INSERT INTO completions (id, goal_id, date, count, created_at)
	       VALUES ($1, $2, $3, $4, $5)
	       ON CONFLICT (goal_id, date) DO UPDATE SET count = completions.count + EXCLUDED.count
       `
	_, err := r.db.Exec(query,
		completion.ID, completion.GoalID, completion.Date, completion.Count, completion.CreatedAt,
	)
	return err
}

func (r *CompletionRepository) GetByGoalID(goalID string) ([]*models.Completion, error) {
	query := `
	       SELECT id, goal_id, date, count, created_at
	       FROM completions
	       WHERE goal_id = $1
	       ORDER BY date DESC
       `
	rows, err := r.db.Query(query, goalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var completions []*models.Completion
	for rows.Next() {
		completion := &models.Completion{}
		err := rows.Scan(
			&completion.ID, &completion.GoalID, &completion.Date, &completion.Count, &completion.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		completions = append(completions, completion)
	}
	return completions, nil
}

func (r *CompletionRepository) GetCompletionExists(goalID string, date time.Time) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM completions WHERE goal_id = $1 AND date = $2)`
	err := r.db.QueryRow(query, goalID, date.Format("2006-01-02")).Scan(&exists)
	return exists, err
}

func (r *CompletionRepository) CalculateCurrentStreak(goalID string) (int, error) {
	query := `
	       WITH consecutive_dates AS (
		       SELECT date,
			      date - INTERVAL '1 day' * ROW_NUMBER() OVER (ORDER BY date DESC) AS group_date
		       FROM completions
		       WHERE goal_id = $1
			 AND date <= CURRENT_DATE
		       ORDER BY date DESC
	       ),
	       streak_groups AS (
		       SELECT group_date, COUNT(*) as streak_length
		       FROM consecutive_dates
		       GROUP BY group_date
		       ORDER BY MAX(date) DESC
	       )
	       SELECT COALESCE(
		       CASE 
			       WHEN MAX(c.date) = CURRENT_DATE OR MAX(c.date) = CURRENT_DATE - INTERVAL '1 day'
			       THEN (SELECT streak_length FROM streak_groups LIMIT 1)
			       ELSE 0
		       END, 0
	       ) as current_streak
	       FROM completions c
	       WHERE c.goal_id = $1
       `

	var streak int
	err := r.db.QueryRow(query, goalID).Scan(&streak)
	return streak, err
}

func (r *CompletionRepository) GetCompletionGraphData(goalID string, days int) ([]models.CompletionGraphData, error) {
	query := `
	       WITH date_series AS (
		       SELECT generate_series(
			       CURRENT_DATE - INTERVAL '%d days',
			       CURRENT_DATE,
			       '1 day'::interval
		       )::date AS date
	       )
	       SELECT 
		       ds.date::text,
		       CASE WHEN c.date IS NOT NULL THEN 1 ELSE 0 END as count
	       FROM date_series ds
	       LEFT JOIN completions c ON c.goal_id = $1 AND c.date = ds.date
	       ORDER BY ds.date
       `

	rows, err := r.db.Query(fmt.Sprintf(query, days), goalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []models.CompletionGraphData
	for rows.Next() {
		var item models.CompletionGraphData
		err := rows.Scan(&item.Date, &item.Count)
		if err != nil {
			return nil, err
		}
		data = append(data, item)
	}
	return data, nil
}
