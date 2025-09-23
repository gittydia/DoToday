package services

import (
	"DoToday/models"
	"DoToday/repositories"
)

type FeedService struct {
	repo *repositories.FeedRepository
}

func NewFeedService(repo *repositories.FeedRepository) *FeedService {
	return &FeedService{repo: repo}
}

func (s *FeedService) CreateFeed(feed *models.Feed) error {
	return s.repo.Create(feed)
}

func (s *FeedService) GetFeedByID(id string) (*models.Feed, error) {
	return s.repo.GetByID(id)
}

func (s *FeedService) GetFeedsByGoalID(goalID string) ([]*models.Feed, error) {
	return s.repo.GetByGoalID(goalID)
}
