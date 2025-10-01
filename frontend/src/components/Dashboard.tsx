import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { GoalCard, Goal } from "./GoalCard";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { CalendarDays, Target, TrendingUp, Award } from "lucide-react";

interface DashboardProps {
  goals: Goal[];
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onToggleCompletion: (goalId: string, date: string) => void;
  onNewGoal: () => void;
}

export function Dashboard({ goals, onEditGoal, onDeleteGoal, onToggleCompletion, onNewGoal }: DashboardProps) {
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate stats
  const totalGoals = goals.length;
  // Calculate progress for today based on each goal's targetCount
  const todayProgress = totalGoals > 0
    ? (goals.reduce((acc, goal) => {
        const todayCompletion = goal.completions.find(c => c.date === today);
        return acc + (todayCompletion ? Math.min(1, todayCompletion.count / goal.targetCount) : 0);
      }, 0) / totalGoals) * 100
    : 0;

  // Calculate streak (consecutive days with all goals completed)
  const calculateStreak = () => {
    if (totalGoals === 0) return 0;
    
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCompleted = goals.every(goal => {
        const completion = goal.completions.find(c => c.date === dateStr);
        return completion && completion.count >= goal.targetCount;
      });
      
      if (dayCompleted) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  // Get this week's completion rate
  const getWeeklyStats = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const dailyCompletions = last7Days.map(date => {
      return goals.filter(goal => {
        const completion = goal.completions.find(c => c.date === date);
        return completion && completion.count >= goal.targetCount;
      }).length;
    });

    const totalPossible = last7Days.length * totalGoals;
    const totalCompleted = dailyCompletions.reduce((sum, count) => sum + count, 0);
    
    return totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0;
  };

  const weeklyProgress = getWeeklyStats();

  if (goals.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h1>Welcome to Do Today</h1>
            <p className="text-muted-foreground">
              Start your productivity journey by creating your first goal.
            </p>
          </div>
          
          <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <Target className="size-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first goal to start tracking your daily progress and building healthy habits.
            </p>
            <Button onClick={onNewGoal}>Create Your First Goal</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground">Track your daily goals and progress</p>
        </div>
        <Button onClick={onNewGoal}>Add Goal</Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(todayProgress)}%</div>
            <Progress value={todayProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(todayProgress)}% completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Active goals you're tracking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {currentStreak === 1 ? 'day' : 'days'} in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(weeklyProgress)}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              Last 7 days completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2>Your Goals</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{goals.length} total</Badge>
            <Badge variant="outline">{Math.round(todayProgress)}% of today's targets</Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={onEditGoal}
              onDelete={onDeleteGoal}
              onToggleCompletion={onToggleCompletion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}