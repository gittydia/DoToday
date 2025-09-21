import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, CheckCircle2, Circle, Calendar } from "lucide-react";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  completions: Array<{
    date: string;
    count: number;
  }>;
  createdAt: string;
}

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onToggleCompletion: (goalId: string, date: string) => void;
}

export function GoalCard({ goal, onEdit, onDelete, onToggleCompletion }: GoalCardProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayCompletion = goal.completions.find(c => c.date === today);
  const completedToday = todayCompletion ? todayCompletion.count >= goal.targetCount : false;

  // Calculate streak and progress
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const weekProgress = last7Days.map(date => {
    const completion = goal.completions.find(c => c.date === date);
    return completion ? completion.count >= goal.targetCount : false;
  });

  const weeklyCompletions = weekProgress.filter(Boolean).length;
  const progressPercentage = (weeklyCompletions / 7) * 100;

  // Map frequency to label
  const frequencyLabel = {
    daily: 'day',
    weekly: 'week',
    monthly: 'month',
  }[goal.frequency] || goal.frequency;

  const getCategoryColor = (category: string) => {
    const colors = {
      health: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      work: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      personal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      learning: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  return (
    <Card className="relative hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg leading-tight">{goal.title}</CardTitle>
              <Badge variant="secondary" className={`${getCategoryColor(goal.category)} text-xs`}>
                {goal.category}
              </Badge>
            </div>
            {goal.description && (
              <CardDescription>{goal.description}</CardDescription>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(goal.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Today's completion */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onToggleCompletion(goal.id, today)}
            >
              {completedToday ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
            <div>
              <p className="font-medium text-sm">Today</p>
              <p className="text-xs text-muted-foreground">
                {completedToday ? 'Completed' : `${goal.targetCount} ${frequencyLabel} target`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {todayCompletion?.count || 0} / {goal.targetCount}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{goal.frequency}</p>
          </div>
        </div>

        {/* Week progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">This Week</p>
            <p className="text-sm text-muted-foreground">{weeklyCompletions}/7 days</p>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex gap-1 justify-between">
            {weekProgress.map((completed, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  completed ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}