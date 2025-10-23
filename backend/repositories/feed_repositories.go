package repositories

import (
	"DoToday/models"
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"
)

type FeedRepository struct {
	db *sql.DB
}

func NewFeedRepository(db *sql.DB) *FeedRepository {
	return &FeedRepository{db: db}
}

func (r *FeedRepository) Create(feed *models.Feed) error {
	// Insert including user_id so RLS policies can check ownership
	query := `
		INSERT INTO feeds (id, goal_id, date, description, user_id)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (goal_id, date) DO NOTHING
	`
	var goalID interface{} = feed.GoalID
	if feed.GoalID == "" {
		goalID = nil
	}
	// Handle nullable date properly: pass a concrete time.Time or nil
	var dateParam interface{} = nil
	if feed.Date != nil {
		dateParam = *feed.Date
	}

	// Debug: print values and types being inserted for diagnosis
	fmt.Printf("Inserting feed: id=%s goal_id=%v (type=%T) date=%v (type=%T) user_id=%s\n", feed.ID, goalID, goalID, dateParam, dateParam, feed.UserID)
	res, err := r.db.Exec(query, feed.ID, goalID, dateParam, feed.Description, interfaceOrNull(feed.UserID))
	if err != nil {
		fmt.Printf("Legacy feed insert error: %v\n", err)
		return err
	}
	rows, _ := res.RowsAffected()
	fmt.Printf("Legacy feed insert success, rows affected: %d\n", rows)
	if rows == 0 {
		// Insert didn't create a row due to ON CONFLICT -> try to load the existing feed
		var id string
		var gid sql.NullString
		var dt time.Time
		var desc sql.NullString
		var uid sql.NullString
		var uname sql.NullString
		var gtitle sql.NullString
		errSel := r.db.QueryRow(`
			SELECT f.id, f.goal_id, f.date, f.description, f.user_id, p.username, g.title
			FROM feeds f
			LEFT JOIN public.profiles p ON f.user_id = p.id
			LEFT JOIN public.goals g ON f.goal_id = g.id
			WHERE f.goal_id = $1 AND f.date = $2
			LIMIT 1`, goalID, dateParam).Scan(&id, &gid, &dt, &desc, &uid, &uname, &gtitle)
		if errSel == nil {
			feed.ID = id
			if gid.Valid {
				feed.GoalID = gid.String
			} else {
				feed.GoalID = ""
			}
			feed.Date = &dt
			if desc.Valid {
				feed.Description = desc.String
			}
			if uid.Valid {
				feed.UserID = uid.String
			} else {
				feed.UserID = ""
			}
			if uname.Valid {
				feed.UserName = uname.String
			} else {
				feed.UserName = ""
			}
			if gtitle.Valid {
				feed.GoalTitle = gtitle.String
			} else {
				feed.GoalTitle = ""
			}
			return nil
		}
		// no existing row found
		return nil
	}
	return nil
}

func (r *FeedRepository) GetByGoalID(goalID string) ([]*models.Feed, error) {
	query := `
		SELECT f.id, f.goal_id, f.date, f.description, f.user_id, p.username, g.title
		FROM feeds f
		LEFT JOIN public.profiles p ON f.user_id = p.id
		LEFT JOIN public.goals g ON f.goal_id = g.id
		WHERE f.goal_id = $1
		ORDER BY f.date DESC
	`
	log.Printf("GetByGoalID query: %s goalID=%s", strings.ReplaceAll(query, "\n", " "), goalID)
	rows, err := r.db.Query(query, goalID)
	if err != nil {
		log.Printf("GetByGoalID db.Query error: %v", err)
		return nil, err
	}
	defer rows.Close()

	var feeds []*models.Feed
	count := 0
	for rows.Next() {
		feed := &models.Feed{}
		var uname sql.NullString
		var gtitle sql.NullString
		var dt time.Time
		var uid sql.NullString
		err := rows.Scan(&feed.ID, &feed.GoalID, &dt, &feed.Description, &uid, &uname, &gtitle)
		if err != nil {
			log.Printf("GetByGoalID rows.Scan error: %v", err)
			return nil, err
		}
		feed.Date = &dt
		if uid.Valid {
			feed.UserID = uid.String
		} else {
			feed.UserID = ""
		}
		if uname.Valid {
			feed.UserName = uname.String
		}
		if gtitle.Valid {
			feed.GoalTitle = gtitle.String
		}
		feeds = append(feeds, feed)
		count++
	}
	log.Printf("GetByGoalID returned %d rows for goalID=%s", count, goalID)
	return feeds, nil
}

func (r *FeedRepository) GetAll() ([]*models.Feed, error) {
	// Legacy simple select (no user columns)
	query := `
		SELECT f.id, f.goal_id, f.date, f.description, f.user_id, p.username, g.title
		FROM feeds f
		LEFT JOIN public.profiles p ON f.user_id = p.id
		LEFT JOIN public.goals g ON f.goal_id = g.id
		ORDER BY f.date DESC
	`
	log.Printf("GetAll query: %s", strings.ReplaceAll(query, "\n", " "))
	rows, err := r.db.Query(query)
	if err != nil {
		log.Printf("GetAll db.Query error: %v", err)
		return nil, err
	}
	defer rows.Close()

	var feeds []*models.Feed
	count := 0
	for rows.Next() {
		feed := &models.Feed{}
		var uname sql.NullString
		var gtitle sql.NullString
		var dt time.Time
		var uid sql.NullString
		if err := rows.Scan(&feed.ID, &feed.GoalID, &dt, &feed.Description, &uid, &uname, &gtitle); err != nil {
			log.Printf("GetAll rows.Scan error: %v", err)
			return nil, err
		}
		feed.Date = &dt
		if uid.Valid {
			feed.UserID = uid.String
		} else {
			feed.UserID = ""
		}
		if uname.Valid {
			feed.UserName = uname.String
		}
		if gtitle.Valid {
			feed.GoalTitle = gtitle.String
		}
		feeds = append(feeds, feed)
		count++
	}
	log.Printf("GetAll returned %d rows", count)
	return feeds, nil
}

func (r *FeedRepository) GetByID(id string) (*models.Feed, error) {
	feed := &models.Feed{}
	query := `
		SELECT id, goal_id, date, description, user_id
		FROM feeds
		WHERE id = $1
	`
	var dt time.Time
	var uid sql.NullString
	err := r.db.QueryRow(query, id).Scan(&feed.ID, &feed.GoalID, &dt, &feed.Description, &uid)
	if err != nil {
		return nil, err
	}
	feed.Date = &dt
	if uid.Valid {
		feed.UserID = uid.String
	} else {
		feed.UserID = ""
	}
	return feed, nil
}

// interfaceOrNull converts empty string to nil for nullable SQL parameters
func interfaceOrNull(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
