import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { AuthModal } from "./components/AuthModal";
import { Dashboard } from "./components/Dashboard";
import { Analytics } from "./components/Analytics";
import { Social } from "./components/Social";
import { Profile } from "./components/Profile";
import { GoalForm } from "./components/GoalForm";
import { Goal } from "./components/GoalCard";

interface User {
  name: string;
  email: string;
  avatar?: string;
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

  // Initialize with demo data
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

    // Demo data with more historical completions for better analytics
    const generateDemoCompletions = () => {
      const completions = [];
      const today = new Date();
      
      // Generate 3 months of random completion data
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Random completion with higher probability for recent dates
        const probability = Math.max(0.3, 1 - (i / 90));
        if (Math.random() < probability) {
          completions.push({ date: dateStr, count: 1 });
        }
      }
      
      return completions;
    };

    const generateWaterCompletions = () => {
      const completions = [];
      const today = new Date();
      
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Random water intake between 4-8 glasses
        const glasses = Math.floor(Math.random() * 5) + 4;
        if (Math.random() < 0.8) { // 80% chance of tracking
          completions.push({ date: dateStr, count: glasses });
        }
      }
      
      return completions;
    };

    const demoGoals: Goal[] = [
      {
        id: '1',
        title: 'Drink 8 glasses of water',
        description: 'Stay hydrated throughout the day',
        category: 'health',
        frequency: 'daily',
        targetCount: 8,
        completions: generateWaterCompletions(),
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
      },
      {
        id: '2',
        title: 'Read for 30 minutes',
        description: 'Read books or articles to expand knowledge',
        category: 'learning',
        frequency: 'daily',
        targetCount: 1,
        completions: generateDemoCompletions(),
        createdAt: new Date(Date.now() - 86400000 * 45).toISOString()
      },
      {
        id: '3',
        title: 'Exercise',
        description: 'Any form of physical activity for at least 30 minutes',
        category: 'health',
        frequency: 'daily',
        targetCount: 1,
        completions: generateDemoCompletions(),
        createdAt: new Date(Date.now() - 86400000 * 60).toISOString()
      },
      {
        id: '4',
        title: 'Meditate',
        description: 'Practice mindfulness and meditation',
        category: 'personal',
        frequency: 'daily',
        targetCount: 1,
        completions: generateDemoCompletions(),
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString()
      },
      {
        id: '5',
        title: 'Learn new skill',
        description: 'Spend time learning programming or other skills',
        category: 'work',
        frequency: 'daily',
        targetCount: 1,
        completions: generateDemoCompletions(),
        createdAt: new Date(Date.now() - 86400000 * 35).toISOString()
      }
    ];
    setGoals(demoGoals);
  }, []);

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

  const handleLogin = (email: string, password: string) => {
    // Mock login - in real app this would call an API
    setUser({
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`
    });
    setShowAuthModal(false);
  };

  const handleRegister = (name: string, email: string, password: string) => {
    // Mock registration - in real app this would call an API
    setUser({
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`
    });
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleSaveGoal = (goalData: Omit<Goal, 'id' | 'completions' | 'createdAt'>) => {
    if (editingGoal) {
      // Update existing goal
      setGoals(goals.map(goal => 
        goal.id === editingGoal.id 
          ? { ...goal, ...goalData }
          : goal
      ));
      setEditingGoal(null);
    } else {
      // Create new goal
      const newGoal: Goal = {
        ...goalData,
        id: Date.now().toString(),
        completions: [],
        createdAt: new Date().toISOString()
      };
      setGoals([...goals, newGoal]);
    }
    setShowGoalForm(false);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(goal => goal.id !== goalId));
  };

  const handleToggleCompletion = (goalId: string, date: string) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        const existingCompletion = goal.completions.find(c => c.date === date);
        if (existingCompletion) {
          // Toggle completion
          const newCount = existingCompletion.count >= goal.targetCount ? 0 : goal.targetCount;
          return {
            ...goal,
            completions: goal.completions.map(c => 
              c.date === date ? { ...c, count: newCount } : c
            )
          };
        } else {
          // Add new completion
          return {
            ...goal,
            completions: [...goal.completions, { date, count: goal.targetCount }]
          };
        }
      }
      return goal;
    }));
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

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
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
                <h1 className="text-4xl font-bold tracking-tight">Welcome to DoToday</h1>
                <p className="text-xl text-muted-foreground">
                  Set, track, and achieve your daily goals with a simple, GitHub-inspired interface.
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