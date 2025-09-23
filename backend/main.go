package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"


	"DoToday/config"
	"DoToday/handlers"
	"DoToday/middleware"
	"DoToday/repositories"
	"DoToday/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database connection
	db, err := config.InitDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	goalRepo := repositories.NewGoalRepository(db)
	completionRepo := repositories.NewCompletionRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo)
	goalService := services.NewGoalService(goalRepo, completionRepo)
	userService := services.NewUserService(userRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	goalHandler := handlers.NewGoalHandler(goalService)
	userHandler := handlers.NewUserHandler(userService)

	// Setup router
	router := setupRouter(authHandler, goalHandler, userHandler)

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func setupRouter(authHandler *handlers.AuthHandler, goalHandler *handlers.GoalHandler, userHandler *handlers.UserHandler) *gin.Engine {
	router := gin.Default()

	// CORS middleware
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://localhost:5173"} //frontend dev ports
	config.AllowCredentials = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	router.Use(cors.New(config))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})


	// Public routes
	api := router.Group("/api")
	{
		// Authentication routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
		}

		// Public goals (feed)
		api.GET("/feed", goalHandler.GetPublicGoals)
	}

	// Protected routes
	protected := api.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	{
		// User routes
		user := protected.Group("/user")
		{
			user.GET("/profile", userHandler.GetProfile)
			user.PUT("/profile", userHandler.UpdateProfile)
			user.GET("/stats", userHandler.GetUserStats)
		}

		// Goal routes
		goals := protected.Group("/goals")
		{
			goals.POST("/", goalHandler.CreateGoal)
			goals.GET("/", goalHandler.GetUserGoals)
			goals.GET("/:id", goalHandler.GetGoalByID)
			goals.PUT("/:id", goalHandler.UpdateGoal)
			goals.DELETE("/:id", goalHandler.DeleteGoal)
			goals.POST("/:id/archive", goalHandler.ArchiveGoal)

			// Completion routes
			goals.POST("/:id/complete", goalHandler.MarkComplete)
			goals.GET("/:id/completions", goalHandler.GetCompletions)
			goals.GET("/:id/streak", goalHandler.GetStreak)
		}
	}

	return router
}
