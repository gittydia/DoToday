package services

import (
	"DoToday/models"
	"DoToday/repositories"
)

type CommentService struct {
	repo *repositories.CommentRepository
}

func NewCommentService(repo *repositories.CommentRepository) *CommentService {
	return &CommentService{repo: repo}
}

func (s *CommentService) CreateComment(comment *models.Comment) error {
	return s.repo.Create(comment)
}

func (s *CommentService) GetCommentsByFeedID(feedID string) ([]*models.Comment, error) {
	return s.repo.GetByFeedID(feedID)
}

func (s *CommentService) DeleteComment(id, userID string) error {
	return s.repo.Delete(id, userID)
}
