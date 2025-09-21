// services/goal_service.go
package services

import (
	"errors"
	"time"

	"DoToday/models"
	"DoToday/repositories"

	"github.com/google/uuid"
)

type GoalService struct {
	goalRepo       *repositories.GoalRepository
	completionRepo *repositories.CompletionRepository
}

func NewGoalService(goalRepo *repositories.GoalRepository, completionRepo *repositories.CompletionRepository) *GoalService {
	return &GoalService{
		goalRepo:       goalRepo,
		completionRepo: completionRepo,
	}
}

func (s *GoalService) CreateGoal(userID uuid.UUID, req *models.CreateGoalRequest) (*models.Goal, error) {
	goal := &models.Goal{
		ID:          uuid.New(),
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Deadline:    req.Deadline,
		IsPublic:    req.IsPublic,
		CreatedAt:   time.Now(),
	}

	if err := s.goalRepo.Create(goal); err != nil {
		return nil, err
	}

	return goal, nil
}

func (s *GoalService) GetUserGoals(userID uuid.UUID) ([]*models.Goal, error) {
	return s.goalRepo.GetByUserID(userID)
}

func (s *GoalService) GetGoalByID(goalID, userID uuid.UUID) (*models.Goal, error) {
	goal, err := s.goalRepo.GetByID(goalID)
	if err != nil {
		return nil, err
	}

	// Check if user owns the goal or if it's public
	if goal.UserID != userID && !goal.IsPublic {
		return nil, errors.New("unauthorized")
	}

	return goal, nil
}

func (s *GoalService) UpdateGoal(goalID, userID uuid.UUID, req *models.UpdateGoalRequest) (*models.Goal, error) {
	goal, err := s.goalRepo.GetByID(goalID)
	if err != nil {
		return nil, err
	}

	if goal.UserID != userID {
		return nil, errors.New("unauthorized")
	}

	// Update fields if provided
	if req.Title != nil {
		goal.Title = *req.Title
	}
	if req.Description != nil {
		goal.Description = *req.Description
	}
	if req.Deadline != nil {
		goal.Deadline = *req.Deadline
	}
	if req.IsPublic != nil {
		goal.IsPublic = *req.IsPublic
	}

	if err := s.goalRepo.Update(goal); err != nil {
		return nil, err
	}

	return goal, nil
}

func (s *GoalService) DeleteGoal(goalID, userID uuid.UUID) error {
	goal, err := s.goalRepo.GetByID(goalID)
	if err != nil {
		return err
	}

	if goal.UserID != userID {
		return errors.New("unauthorized")
	}

	return s.goalRepo.Delete(goalID, userID)
}

func (s *GoalService) ArchiveGoal(goalID, userID uuid.UUID) error {
	goal, err := s.goalRepo.GetByID(goalID)
	if err != nil {
		return err
	}

	if goal.UserID != userID {
		return errors.New("unauthorized")
	}

	return s.goalRepo.Archive(goalID, userID)
}

func (s *GoalService) MarkComplete(goalID, userID uuid.UUID) error {
	goal, err := s.goalRepo.GetByID(goalID)
	if err != nil {
		return err
	}

	if goal.UserID != userID {
		return errors.New("unauthorized")
	}

	today := time.Now().UTC().Truncate(24 * time.Hour)

	// Check if already completed today
	exists, err := s.completionRepo.GetCompletionExists(goalID, today)
	if err != nil {
		return err
	}

	if exists {
		return errors.New("already completed today")
	}

	// Create completion
	completion := &models.Completion{
		ID:        uuid.New(),
		GoalID:    goalID,
		Date:      today,
		CreatedAt: time.Now(),
	}

	if err := s.completionRepo.Create(completion); err != nil {
		return err
	}

	// Update current streak
	streak, err := s.completionRepo.CalculateCurrentStreak(goalID)
	if err != nil {
		return err
	}

	return s.goalRepo.UpdateStreak(goalID, streak)
}

func (s *GoalService) GetCompletions(goalID, userID uuid.UUID) ([]*models.Completion, error) {
	goal, err := s.goalRepo.GetByID(goalID)
	if err != nil {
		return nil, err
	}

	if goal.UserID != userID && !goal.IsPublic {
		return nil, errors.New("unauthorized")
	}

	return s.completionRepo.GetByGoalID(goalID)
}

func (s *GoalService) GetStreak(goalID, userID uuid.UUID) (*models.StreakResponse, error) {
	goal, err := s.goalRepo.GetByID(goalID)
	if err != nil {
		return nil, err
	}

	if goal.UserID != userID && !goal.IsPublic {
		return nil, errors.New("unauthorized")
	}

	currentStreak, err := s.completionRepo.CalculateCurrentStreak(goalID)
	if err != nil {
		return nil, err
	}

	longestStreak, err := s.goalRepo.GetLongestStreak(goalID)
	if err != nil {
		return nil, err
	}

	// Get completion data for graph (last 365 days)
	graphData, err := s.completionRepo.GetCompletionGraphData(goalID, 365)
	if err != nil {
		return nil, err
	}

	totalCompletions := len(graphData)
	return &models.StreakResponse{
		CurrentStreak: currentStreak,
		LongestStreak: longestStreak,
		Completions:   totalCompletions,
	}, nil
}

func (s *GoalService) GetPublicGoals(limit int) ([]*models.Goal, error) {
	if limit <= 0 || limit > 100 {
		limit = 50 // Default limit
	}
	return s.goalRepo.GetPublicGoals(limit)
}
