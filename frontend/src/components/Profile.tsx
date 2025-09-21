import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Goal } from "./GoalCard";
import { User, Target, Trophy, Calendar, TrendingUp, Award, BarChart3, Clock } from "lucide-react";

interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface ProfileProps {
  user: User;
  goals: Goal[];
  isOwnProfile?: boolean;
}

export function Profile({ user, goals, isOwnProfile = true }: ProfileProps) {
  // Calculate user statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const todayCompleted = goals.filter(goal => {
      const completion = goal.completions.find(c => c.date === today);
      return completion && completion.count >= goal.targetCount;
    }).length;

    const monthlyCompletions = last30Days.reduce((sum, date) => {
      const dayCompleted = goals.filter(goal => {
        const completion = goal.completions.find(c => c.date === date);
        return completion && completion.count >= goal.targetCount;
      }).length;
      return sum + dayCompleted;
    }, 0);

    // Calculate current streak
    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCompleted = goals.every(goal => {
        const completion = goal.completions.find(c => c.date === dateStr);
        return completion && completion.count >= goal.targetCount;
      });
      
      if (dayCompleted && goals.length > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 365; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCompleted = goals.every(goal => {
        const completion = goal.completions.find(c => c.date === dateStr);
        return completion && completion.count >= goal.targetCount;
      });
      
      if (dayCompleted && goals.length > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate total completions
    const totalCompletions = goals.reduce((sum, goal) => {
      return sum + goal.completions.filter(c => c.count >= goal.targetCount).length;
    }, 0);

    // Calculate average completion rate
    const completionRate = goals.length > 0 ? Math.round((monthlyCompletions / (goals.length * 30)) * 100) : 0;

    return {
      todayCompleted,
      monthlyCompletions,
      currentStreak,
      longestStreak,
      totalCompletions,
      completionRate,
      totalGoals: goals.length,
      activeGoals: goals.length
    };
  }, [goals]);

  // Get category breakdown
  const categoryStats = useMemo(() => {
    const categories: Record<string, { count: number; completed: number }> = {};
    
    goals.forEach(goal => {
      if (!categories[goal.category]) {
        categories[goal.category] = { count: 0, completed: 0 };
      }
      categories[goal.category].count++;
      
      // Count goals with recent completions (last 7 days)
      const recent = goal.completions.filter(c => {
        const date = new Date(c.date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && c.count >= goal.targetCount;
      });
      
      if (recent.length > 0) {
        categories[goal.category].completed++;
      }
    });

    return Object.entries(categories).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: data.count,
      completed: data.completed,
      percentage: data.count > 0 ? Math.round((data.completed / data.count) * 100) : 0
    }));
  }, [goals]);

  // Get recent achievements
  const recentAchievements = useMemo(() => {
    const achievements = [];
    
    // Current streak achievement
    if (stats.currentStreak >= 7) {
      achievements.push({
        type: 'streak',
        title: `${stats.currentStreak} Day Streak`,
        description: 'Consistent daily goal completion',
        icon: Trophy,
        color: 'text-yellow-600'
      });
    }
    
    // Goal completion achievements
    if (stats.totalCompletions >= 100) {
      achievements.push({
        type: 'milestone',
        title: 'Century Club',
        description: '100+ goals completed',
        icon: Award,
        color: 'text-purple-600'
      });
    } else if (stats.totalCompletions >= 50) {
      achievements.push({
        type: 'milestone',
        title: 'Half Century',
        description: '50+ goals completed',
        icon: Award,
        color: 'text-blue-600'
      });
    }
    
    // High completion rate
    if (stats.completionRate >= 80) {
      achievements.push({
        type: 'performance',
        title: 'High Achiever',
        description: '80%+ completion rate',
        icon: TrendingUp,
        color: 'text-green-600'
      });
    }
    
    // Category master
    const masterCategory = categoryStats.find(cat => cat.count >= 5 && cat.percentage >= 90);
    if (masterCategory) {
      achievements.push({
        type: 'category',
        title: `${masterCategory.name} Master`,
        description: `Excellent in ${masterCategory.name.toLowerCase()} goals`,
        icon: Target,
        color: 'text-orange-600'
      });
    }
    
    return achievements.slice(0, 4); // Show top 4 achievements
  }, [stats, categoryStats]);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'health': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'learning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'personal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'work': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const joinedDate = useMemo(() => {
    if (goals.length === 0) return new Date();
    const earliest = goals.reduce((earliest, goal) => {
      const goalDate = new Date(goal.createdAt);
      return goalDate < earliest ? goalDate : earliest;
    }, new Date(goals[0].createdAt));
    return earliest;
  }, [goals]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-2xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
              <div className="flex flex-col md:flex-row items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <User className="size-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  <span>Joined {joinedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              
              {isOwnProfile && (
                <Button variant="outline" className="gap-2">
                  <User className="size-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalGoals}</div>
            <div className="text-sm text-muted-foreground">Active Goals</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Current Streak</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.totalCompletions}</div>
            <div className="text-sm text-muted-foreground">Total Completions</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.completionRate}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5" />
              Achievements
            </CardTitle>
            <CardDescription>
              Milestones and accomplishments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAchievements.length > 0 ? (
              recentAchievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <Icon className={`size-6 ${achievement.color}`} />
                    <div className="flex-1">
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="size-12 mx-auto mb-4 opacity-50" />
                <p>No achievements yet</p>
                <p className="text-sm">Complete goals to unlock achievements!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goal Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              Goal Categories
            </CardTitle>
            <CardDescription>
              Breakdown by category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryStats.length > 0 ? (
              categoryStats.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getCategoryColor(category.name)}>
                        {category.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {category.completed}/{category.count} goals
                      </span>
                    </div>
                    <span className="text-sm font-medium">{category.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all duration-300"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="size-12 mx-auto mb-4 opacity-50" />
                <p>No goals yet</p>
                <p className="text-sm">Create your first goal to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Detailed Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="size-4" />
                <span className="text-sm">Today's Progress</span>
              </div>
              <div className="text-2xl font-bold">{stats.todayCompleted}/{stats.totalGoals}</div>
              <div className="text-sm text-muted-foreground">goals completed</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4" />
                <span className="text-sm">This Month</span>
              </div>
              <div className="text-2xl font-bold">{stats.monthlyCompletions}</div>
              <div className="text-sm text-muted-foreground">total completions</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="size-4" />
                <span className="text-sm">Longest Streak</span>
              </div>
              <div className="text-2xl font-bold">{stats.longestStreak}</div>
              <div className="text-sm text-muted-foreground">days in a row</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" />
                <span className="text-sm">Average Rate</span>
              </div>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <div className="text-sm text-muted-foreground">success rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}