package repositories

import (
	"DoToday/models"
	"database/sql"
)

type GoalRepository struct {
	db *sql.DB
}

func NewGoalRepository(db *sql.DB) *GoalRepository {
	return &GoalRepository{db: db}
}

func (r *GoalRepository) Create(goal *models.Goal) error {
	query := `
	       INSERT INTO goals (id, user_id, title, category, description, frequency, target_count, deadline, is_public, current_streak, archived, created_at)
	       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       `
	_, err := r.db.Exec(query,
		goal.ID, goal.UserID, goal.Title, goal.Category, goal.Description, goal.Frequency, goal.TargetCount,
		goal.Deadline, goal.IsPublic, goal.CurrentStreak, goal.Archived, goal.CreatedAt,
	)
	return err
}

func (r *GoalRepository) GetByID(id string) (*models.Goal, error) {
	goal := &models.Goal{}
	query := `
	       SELECT id, user_id, title, category, description, frequency, target_count, deadline, is_public, current_streak, archived, created_at
	       FROM goals
	       WHERE id = $1
       `
	err := r.db.QueryRow(query, id).Scan(
		&goal.ID, &goal.UserID, &goal.Title, &goal.Category, &goal.Description, &goal.Frequency, &goal.TargetCount,
		&goal.Deadline, &goal.IsPublic, &goal.CurrentStreak, &goal.Archived, &goal.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return goal, nil
}

func (r *GoalRepository) GetByUserID(userID string) ([]*models.Goal, error) {
	query := `
	       SELECT id, user_id, title, category, description, frequency, target_count, deadline, is_public, current_streak, archived, created_at
	       FROM goals
	       WHERE user_id = $1 AND archived = false
	       ORDER BY created_at DESC
       `
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var goals []*models.Goal
	for rows.Next() {
		goal := &models.Goal{}
		err := rows.Scan(
			&goal.ID, &goal.UserID, &goal.Title, &goal.Category, &goal.Description, &goal.Frequency, &goal.TargetCount,
			&goal.Deadline, &goal.IsPublic, &goal.CurrentStreak, &goal.Archived, &goal.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		goals = append(goals, goal)
	}
	return goals, nil
}

func (r *GoalRepository) GetPublicGoals(limit int) ([]*models.Goal, error) {
	query := `
		SELECT g.id, g.user_id, g.title, g.description, g.deadline, g.is_public, 
		       g.current_streak, g.archived, g.created_at, p.username
		FROM goals g
		JOIN profiles p ON g.user_id = p.id
		WHERE g.is_public = true AND g.archived = false
		ORDER BY g.created_at DESC
		LIMIT $1
	`
	rows, err := r.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var goals []*models.Goal
	for rows.Next() {
		goal := &models.Goal{}
		err := rows.Scan(
			&goal.ID, &goal.UserID, &goal.Title, &goal.Category, &goal.Description, &goal.Frequency, &goal.TargetCount,
			&goal.Deadline, &goal.IsPublic, &goal.CurrentStreak, &goal.Archived, &goal.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		goals = append(goals, goal)
	}
	return goals, nil
}

func (r *GoalRepository) Update(goal *models.Goal) error {
	query := `
		UPDATE goals
		SET title = $1, description = $2, deadline = $3, is_public = $4
		WHERE id = $5 AND user_id = $6
	`
	_, err := r.db.Exec(query,
		goal.Title, goal.Description, goal.Deadline, goal.IsPublic, goal.ID, goal.UserID,
	)
	return err
}

func (r *GoalRepository) Delete(id, userID string) error {
	query := `DELETE FROM goals WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, id, userID)
	return err
}

func (r *GoalRepository) Archive(id, userID string) error {
	query := `UPDATE goals SET archived = true WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, id, userID)
	return err
}

func (r *GoalRepository) UpdateStreak(goalID string, streak int) error {
	query := `UPDATE goals SET current_streak = $1 WHERE id = $2`
	_, err := r.db.Exec(query, streak, goalID)
	return err
}

func (r *GoalRepository) GetLongestStreak(goalID string) (int, error) {
	var streak int
	query := `SELECT calculate_longest_streak($1)`
	err := r.db.QueryRow(query, goalID).Scan(&streak)
	return streak, err
}
