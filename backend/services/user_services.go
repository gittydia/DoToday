// services/user_service.go
package services

import (
	"database/sql"
	"errors"

	"DoToday/models"
	"DoToday/repositories"

	"github.com/google/uuid"
)

type UserService struct {
	userRepo *repositories.UserRepository
}

func NewUserService(userRepo *repositories.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) GetProfile(userID uuid.UUID) (*models.User, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	// Remove password from response
	user.Password = ""
	return user, nil
}

func (s *UserService) UpdateProfile(userID uuid.UUID, req *models.UpdateProfileRequest) (*models.User, error) {
	// Get current user
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	// Update username if provided
	if req.Username != nil && *req.Username != user.Username {
		// Check if username is already taken
		_, err := s.userRepo.GetByUsername(*req.Username)
		if err == nil {
			return nil, errors.New("username already exists")
		} else if err != sql.ErrNoRows {
			return nil, err
		}

		if err := s.userRepo.UpdateUsername(userID, *req.Username); err != nil {
			return nil, err
		}
		user.Username = *req.Username
	}

	// Remove password from response
	user.Password = ""
	return user, nil
}

func (s *UserService) GetUserStats(userID uuid.UUID) (*models.UserStats, error) {
	return s.userRepo.GetStats(userID)
}
