// Get all user goals
export async function getGoals(token) {
    const res = await fetch(`${API_BASE}/goals/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}
// Create a new goal
export async function createGoal(data, token) {
    // Map camelCase to snake_case for backend compatibility
    const payload = {
        ...data,
        target_count: data.targetCount,
    };
    delete payload.targetCount;
    const res = await fetch(`${API_BASE}/goals/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
    return res.json();
}
const API_BASE = "http://localhost:8080/api";

export async function register({username, password, email}){
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({username, password, email})
    });
    return res.json();
}

export async function login({username, password}){
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
            body: JSON.stringify({ username, password })
    });
    return res.json();
}

export async function logout (token){
    const res = await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}


export async function feed(params) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await fetch(`${API_BASE}/feed${query}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    return res.json();
}


export async function getUserProfile(token) {
    const res = await fetch(`${API_BASE}/user/profile`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
    }

    export async function updateUserProfile(data, token) {
        const res = await fetch(`${API_BASE}/user/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return res.json();
    }

    export async function getUserStats(token) {
        const res = await fetch(`${API_BASE}/user/stats`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        return res.json();
}

export async function likeFeed(feedId, token) {
    const res = await fetch(`${API_BASE}/likes/feed/${feedId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}

export async function commentOnFeed(feedId, comment, token) {
    const res = await fetch(`${API_BASE}/comments/feed/${feedId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ comment })
    });
    return res.json();
}
// Goal completions
export async function completeGoal(goalId, token) {
    const res = await fetch(`${API_BASE}/goals/${goalId}/complete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}

export async function getGoalCompletions(goalId, token) {
    const res = await fetch(`${API_BASE}/goals/${goalId}/completions`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}

export async function archiveGoal(goalId, token) {
    const res = await fetch(`${API_BASE}/goals/${goalId}/archive`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}

// Feed creation
export async function createFeed(data, token) {
    const res = await fetch(`${API_BASE}/feeds/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    return res.json();
}

// Get feeds by goal
export async function getFeedsByGoal(goalId, token) {
    const res = await fetch(`${API_BASE}/feeds/${goalId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}

// Get feed by ID
export async function getFeedById(feedId, token) {
    const res = await fetch(`${API_BASE}/feed/${feedId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}

// Comments endpoints
export async function getCommentsByFeed(feedId, token) {
    const res = await fetch(`${API_BASE}/comments/feed/${feedId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}

export async function deleteComment(commentId, token) {
    const res = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}

// Likes endpoints
export async function deleteLike(feedId, token) {
    const res = await fetch(`${API_BASE}/likes/feed/${feedId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}

export async function countLikes(feedId, token) {
    const res = await fetch(`${API_BASE}/likes/feed/${feedId}/count`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}

export async function likeExists(feedId, token) {
    const res = await fetch(`${API_BASE}/likes/feed/${feedId}/exists`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}


export async function getGoalStreak(goalId, token) {
    const res = await fetch(`${API_BASE}/goals/${goalId}/streak`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return res.json();
}

export async function updateGoal(id, data, token) {
  const res = await fetch(`${API_BASE}/goals/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
}


export async function deleteGoal(id, token) {
  const res = await fetch(`${API_BASE}/goals/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  return res.json();
}





