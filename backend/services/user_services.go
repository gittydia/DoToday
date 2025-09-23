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

func (s *UserService) GetProfile(userID string) (*models.Profile, error) {
	profile, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}
	return profile, nil
}

func (s *UserService) UpdateProfile(userID string, req *models.UpdateProfileRequest) (*models.Profile, error) {
	// Get current profile
	profile, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	// Update username if provided
	if req.Username != nil && *req.Username != profile.Username {
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
		profile.Username = *req.Username
	}

	return profile, nil
}

func (s *UserService) GetUserStats(userID uuid.UUID) (*models.UserStats, error) {
	return s.userRepo.GetStats(userID)
}
