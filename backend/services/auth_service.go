// services/auth_service.go
package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"DoToday/models"
	"DoToday/repositories"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo *repositories.UserRepository
}

func NewAuthService(userRepo *repositories.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

func (s *AuthService) Register(req *models.RegisterRequest) (*models.AuthResponse, error) {
	// Check if username or email already exists
	_, err := s.userRepo.GetByUsername(req.Username)
	if err == nil {
		return nil, errors.New("username already exists")
	}

	// Call Supabase Auth API to create user
	type supabaseSignupReq struct {
		Email        string                 `json:"email"`
		Password     string                 `json:"password"`
		UserMetadata map[string]interface{} `json:"user_metadata"`
		Data         map[string]interface{} `json:"data"`
	}
	
	type supabaseError struct {
		Message string `json:"message"`
		Code    int    `json:"code"`
	}

	type supabaseSignupResp struct {
		ID           string                 `json:"id"`
		Aud          string                 `json:"aud"`
		Role         string                 `json:"role"`
		Email        string                 `json:"email"`
		Phone        string                 `json:"phone"`
		AppMetadata  map[string]interface{} `json:"app_metadata"`
		UserMetadata map[string]interface{} `json:"user_metadata"`
		Identities   []interface{}          `json:"identities"`
		CreatedAt    string                 `json:"created_at"`
		UpdatedAt    string                 `json:"updated_at"`
		Message      string                 `json:"message"` // For error responses
	}

	// Print request data for debugging
	fmt.Printf("Registering user: email=%s, username=%s\n", req.Email, req.Username)

	signupBody, _ := json.Marshal(supabaseSignupReq{
		Email:        req.Email,
		Password:     req.Password,
		UserMetadata: map[string]interface{}{"username": req.Username},
		Data:         map[string]interface{}{"username": req.Username},
	})

	// Print request body for debugging
	fmt.Printf("Request body: %s\n", string(signupBody))

	sbUrl := os.Getenv("SUPABASE_URL") + "/auth/v1/admin/users"
	sbKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if sbUrl == "" || sbKey == "" {
		return nil, errors.New("supabase configuration missing")
	}

	reqHttp, err := http.NewRequest("POST", sbUrl, bytes.NewBuffer(signupBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	
	reqHttp.Header.Set("apikey", sbKey)
	reqHttp.Header.Set("Authorization", "Bearer "+sbKey)
	reqHttp.Header.Set("Content-Type", "application/json")
	reqHttp.Header.Set("Prefer", "return=representation") // Important for getting full response

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(reqHttp)
	if err != nil {
		return nil, fmt.Errorf("failed to call Supabase Auth API: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}



	// Check for error responses first
	if resp.StatusCode >= 400 {
		var errorResp supabaseError
		if err := json.Unmarshal(body, &errorResp); err == nil && errorResp.Message != "" {
			return nil, fmt.Errorf("supabase auth error: %s (code=%d)", errorResp.Message, errorResp.Code)
		}
		return nil, fmt.Errorf("supabase auth error: status=%d, body=%s", resp.StatusCode, string(body))
	}

	var sbResp supabaseSignupResp
	if err := json.Unmarshal(body, &sbResp); err != nil {
		return nil, fmt.Errorf("failed to decode Supabase response (status=%d): %w, body: %s",
			resp.StatusCode, err, string(body))
	}

	if sbResp.ID == "" {
		// Check if it's an error response in a different format
		if sbResp.Message != "" {
			return nil, fmt.Errorf("supabase auth error: %s", sbResp.Message)
		}
		return nil, fmt.Errorf("supabase auth error: no ID returned in response (status=%d): %s",
			resp.StatusCode, string(body))
	}

	userID, err := uuid.Parse(sbResp.ID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format from Supabase: %w", err)
	}

	// Extract username from user metadata
	username, ok := sbResp.UserMetadata["username"].(string)
	if !ok || username == "" {
		username = req.Username // fallback to request username if not in metadata
	}

	// Hash password for local storage
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Parse creation time
	var createdAt time.Time
	if sbResp.CreatedAt != "" {
		createdAt, err = time.Parse(time.RFC3339, sbResp.CreatedAt)
		if err != nil {
			createdAt = time.Now()
		}
	} else {
		createdAt = time.Now()
	}

	user := &models.User{
		ID:        userID,
		Username:  username,
		Email:     sbResp.Email,
		Password:  string(hashedPassword),
		CreatedAt: createdAt,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, fmt.Errorf("failed to insert profile: %w", err)
	}

	// Generate JWT token
	token, err := s.generateJWT(user.ID)
	if err != nil {
		return nil, err
	}

	user.Password = ""
	return &models.AuthResponse{
		User:  *user,
		Token: token,
	}, nil
}

func (s *AuthService) Login(req *models.LoginRequest) (*models.AuthResponse, error) {
	// Get user by username
	user, err := s.userRepo.GetByUsername(req.Username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Generate JWT token
	token, err := s.generateJWT(user.ID)
	if err != nil {
		return nil, err
	}

	// Remove password from response
	user.Password = ""

	return &models.AuthResponse{
		User:  *user,
		Token: token,
	}, nil
}

func (s *AuthService) generateJWT(userID uuid.UUID) (string, error) {
	claims := &jwt.RegisteredClaims{
		Subject:   userID.String(),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}