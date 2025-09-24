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
	feedRepo := repositories.NewFeedRepository(db)
	commentRepo := repositories.NewCommentRepository(db)
	likeRepo := repositories.NewLikeRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo)
	goalService := services.NewGoalService(goalRepo, completionRepo)
	userService := services.NewUserService(userRepo)
	feedService := services.NewFeedService(feedRepo)
	commentService := services.NewCommentService(commentRepo)
	likeService := services.NewLikeService(likeRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	goalHandler := handlers.NewGoalHandler(goalService)
	userHandler := handlers.NewUserHandler(userService)
	feedHandler := handlers.NewFeedHandler(feedService)
	commentHandler := handlers.NewCommentHandler(commentService)
	likeHandler := handlers.NewLikeHandler(likeService)

	// Setup router
	router := setupRouter(authHandler, goalHandler, userHandler, feedHandler, commentHandler, likeHandler)
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

func setupRouter(
	authHandler *handlers.AuthHandler,
	goalHandler *handlers.GoalHandler,
	userHandler *handlers.UserHandler,
	feedHandler *handlers.FeedHandler,
	commentHandler *handlers.CommentHandler,
	likeHandler *handlers.LikeHandler,
) *gin.Engine {
	router := gin.Default()
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3000", "http://localhost:5173"} //frontend dev ports
	corsConfig.AllowCredentials = true
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	router.Use(cors.New(corsConfig))

	// Health check
	router.GET("/healthz", func(c *gin.Context) {
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

		// Public feed endpoints
		api.GET("/feeds/:goal_id", feedHandler.GetFeedsByGoalID)
		api.GET("/feed/:id", feedHandler.GetFeedByID)
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

		// Feed routes
		feeds := protected.Group("/feeds")
		{
			feeds.POST("/", feedHandler.CreateFeed)
		}

		// Comment routes
		comments := protected.Group("/comments")
		{
			comments.POST("/", commentHandler.CreateComment)
			comments.GET("/feed/:feed_id", commentHandler.GetCommentsByFeedID)
			comments.DELETE("/:id", commentHandler.DeleteComment)
		}

		// Like routes
		likes := protected.Group("/likes")
		{
			likes.POST("/", likeHandler.CreateLike)
			likes.DELETE("/feed/:feed_id", likeHandler.DeleteLike)
			likes.GET("/feed/:feed_id/count", likeHandler.CountLikes)
			likes.GET("/feed/:feed_id/exists", likeHandler.Exists)
		}
	}

	return router
}
