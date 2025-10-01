import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { AuthModal } from "./components/AuthModal";
import { Dashboard } from "./components/Dashboard";
import { Analytics } from "./components/Analytics";
import { Social } from "./components/Social";
import { Profile } from "./components/Profile";
import { GoalForm } from "./components/GoalForm";
import { Goal } from "./components/GoalCard";
import * as api from "./lib/api";

interface User {
  name: string;
  email: string;
  token?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics' | 'social' | 'profile'>('dashboard');
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);

  useEffect(() => {
    // Check for saved theme
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      const isDark = JSON.parse(savedTheme);
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    }
    // Try to restore user from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user && user.token) {
      fetchGoals(user.token);
    } else {
      setGoals([]);
    }
  }, [user]);

  const fetchGoals = async (token: string) => {
    try {
      const data = await api.getGoals(token);
      const goalsArray = Array.isArray(data) ? data : data.goals || [];
      setGoals(goalsArray.map((goal: any) => ({
        ...goal,
        targetCount: goal.target_count ?? 1,
        completions: Array.isArray(goal.completions)
          ? goal.completions.map((c: { date: string; count: number }) => ({
              ...c,
              date: c.date ? new Date(c.date).toISOString().split('T')[0] : ''
            }))
          : []
      })));
    } catch (err) {
      setGoals([]);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      const res = await api.login({ username, password });
      if (res.token) {
        const userObj = { name: res.username || username, email: username, token: res.token };
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        setShowAuthModal(false);
      } else {
        alert(res.message || 'Login failed');
      }
    } catch (err) {
      alert('Login error');
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    try {
      const res = await api.register({ username: name, email, password });
      if (res.token) {
        const userObj = { name, email, token: res.token };
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        setShowAuthModal(false);
      } else {
        alert(res.message || 'Registration failed');
      }
    } catch (err) {
      alert('Registration error');
    }
  };

  const handleLogout = async () => {
    if (user && user.token) {
      await api.logout(user.token);
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  const handleSaveGoal = async (goalData: Omit<Goal, 'id' | 'completions' | 'createdAt'>) => {
    if (!user || !user.token) return;
    try {
      if (editingGoal) {
        await api.updateGoal(editingGoal.id, goalData, user.token);
      } else {
        await api.createGoal(goalData, user.token);
      }
      await fetchGoals(user.token);
      setEditingGoal(null);
      setShowGoalForm(false);
    } catch (err) {
      alert('Failed to save goal');
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user || !user.token) return;
    try {
      await api.deleteGoal(goalId, user.token);
      await fetchGoals(user.token);
    } catch (err) {
      alert('Failed to delete goal');
    }
  };

  const handleToggleCompletion = async (goalId: string, date: string) => {
    if (!user || !user.token) return;
    try {
      await api.completeGoal(goalId, user.token);
      await fetchGoals(user.token);
    } catch (err) {
      alert('Failed to complete goal');
    }
  };

  const handleNewGoal = () => {
    setEditingGoal(null);
    setShowGoalForm(true);
  };

  const handleViewProfile = (userId: string) => {
    setViewingProfile(userId);
    setCurrentView('profile');
  };

  const renderCurrentView = () => {
    if (!user) return null;
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            goals={goals}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            onToggleCompletion={handleToggleCompletion}
            onNewGoal={handleNewGoal}
          />
        );
      case 'analytics':
        return <Analytics goals={goals} />;
      case 'social':
        return (
          <Social
            user={user}
            goals={goals}
            onViewProfile={handleViewProfile}
          />
        );
      case 'profile':
        return (
          <Profile
            user={user}
            goals={goals}
            isOwnProfile={!viewingProfile || viewingProfile === user.email}
          />
        );
      default:
        return null;
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user ?? undefined}
        onLogin={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onNewGoal={handleNewGoal}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      <main>
        {user ? (
          renderCurrentView()
        ) : (
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Welcome to Do Today</h1>
                <p className="text-xl text-muted-foreground">
                  Set and track your daily, monthly, and yearly goals with ease. Stay motivated and achieve more every day!
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Set Goals</h3>
                  <p className="text-muted-foreground text-sm">
                    Create daily, weekly, or monthly goals with custom targets and categories.
                  </p>
                </div>
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Track Progress</h3>
                  <p className="text-muted-foreground text-sm">
                    Mark completions and visualize your streaks and weekly progress.
                  </p>
                </div>
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Stay Motivated</h3>
                  <p className="text-muted-foreground text-sm">
                    See your achievements and maintain consistency with visual feedback.
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
      <GoalForm
        open={showGoalForm}
        onClose={() => {
          setShowGoalForm(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        editingGoal={editingGoal}
      />
    </div>
  );
}