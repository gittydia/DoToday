package services

import (
	"DoToday/models"
	"DoToday/repositories"
)

type LikeService struct {
	repo *repositories.LikeRepository
}

func NewLikeService(repo *repositories.LikeRepository) *LikeService {
	return &LikeService{repo: repo}
}

func (s *LikeService) CreateLike(like *models.Like) error {
	return s.repo.Create(like)
}

func (s *LikeService) DeleteLike(feedID, userID string) error {
	return s.repo.Delete(feedID, userID)
}

func (s *LikeService) CountLikes(feedID string) (int, error) {
	return s.repo.Count(feedID)
}

func (s *LikeService) Exists(feedID, userID string) (bool, error) {
	return s.repo.Exists(feedID, userID)
}
