import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import type { Goal } from "./GoalCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { Calendar, TrendingUp, Target, Award, BarChart3 } from "lucide-react";

interface AnalyticsProps {
  goals: Goal[];
}

// Custom GitHub-style contribution calendar component
function ContributionCalendar({ data }: { data: Record<string, number> }) {
  const getContributionLevel = (count: number) => {
    if (count === 0) return 0;
    if (count <= 1) return 1;
    if (count <= 2) return 2;
    if (count <= 3) return 3;
    return 4;
  };

  const getColor = (level: number) => {
    const colors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
    return colors[level];
  };

  // Generate calendar grid for the past year
  const generateCalendarGrid = () => {
    const weeks = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // Go back 52 weeks (364 days)
    
    // Start from the beginning of the week
    const startOfWeek = new Date(startDate);
    startOfWeek.setDate(startDate.getDate() - startDate.getDay());
    
    for (let week = 0; week < 53; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + (week * 7) + day);
        
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = data[dateStr] || 0;
        const level = getContributionLevel(count);
        
        weekDays.push({
          date: dateStr,
          count,
          level,
          color: getColor(level)
        });
      }
      weeks.push(weekDays);
    }
    
    return weeks;
  };

  const calendarGrid = generateCalendarGrid();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Month labels */}
        <div className="flex mb-2 ml-8">
          {months.map((month, index) => (
            <div key={month} className="flex-1 text-xs text-muted-foreground text-center">
              {month}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col mr-2 text-xs text-muted-foreground">
            <div className="h-3"></div>
            <div className="h-3 flex items-center">Mon</div>
            <div className="h-3"></div>
            <div className="h-3 flex items-center">Wed</div>
            <div className="h-3"></div>
            <div className="h-3 flex items-center">Fri</div>
            <div className="h-3"></div>
          </div>
          
          {/* Grid */}
          <div className="flex gap-1">
            {calendarGrid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className="w-3 h-3 cursor-pointer hover:ring-1 hover:ring-gray-400 transition-all"
                    style={{ backgroundColor: day.color }}
                    title={`${day.count} contributions on ${day.date}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Analytics({ goals }: AnalyticsProps) {
  // Generate contribution calendar data
  const contributionData = useMemo(() => {
    const data: Record<string, number> = {};
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12); // Last 12 months
    
    // Initialize all dates with 0
    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      data[d.toISOString().split('T')[0]] = 0;
    }
    
    // Fill with actual completion data
    goals.forEach(goal => {
      goal.completions.forEach(completion => {
        if (completion.count >= goal.targetCount) {
          data[completion.date] = (data[completion.date] || 0) + 1;
        }
      });
    });
    
    return data;
  }, [goals]);

  // Generate monthly completion data for line chart
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      let completions = 0;
      let possibleCompletions = 0;
      
      goals.forEach(goal => {
        goal.completions.forEach(completion => {
          const compDate = new Date(completion.date);
          if (compDate.getMonth() === date.getMonth() && compDate.getFullYear() === year) {
            if (completion.count >= goal.targetCount) {
              completions++;
            }
          }
        });
        
        // Calculate possible completions for the month
        const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
        possibleCompletions += daysInMonth;
      });
      
      months.push({
        month: monthStr,
        completions,
        rate: possibleCompletions > 0 ? Math.round((completions / possibleCompletions) * 100) : 0
      });
    }
    
    return months;
  }, [goals]);

  // Category breakdown data
  const categoryData = useMemo(() => {
    const categories: Record<string, { total: number; completed: number; color: string }> = {};
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
    
    goals.forEach((goal, index) => {
      if (!categories[goal.category]) {
        categories[goal.category] = {
          total: 0,
          completed: 0,
          color: colors[index % colors.length]
        };
      }
      
      categories[goal.category].total++;
      
      // Count completed goals (goals with recent completions)
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
      value: data.completed,
      total: data.total,
      color: data.color,
      percentage: Math.round((data.completed / data.total) * 100)
    }));
  }, [goals]);

  // Weekly streak data
  const weeklyData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      let completedDays = 0;
      
      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayCompleted = goals.every(goal => {
          const completion = goal.completions.find(c => c.date === dateStr);
          return completion && completion.count >= goal.targetCount;
        });
        
        if (dayCompleted && goals.length > 0) {
          completedDays++;
        }
      }
      
      weeks.push({
        week: `Week ${12 - i}`,
        completedDays,
        percentage: Math.round((completedDays / 7) * 100)
      });
    }
    
    return weeks;
  }, [goals]);

  // Daily progress data (last 30 days)
  const dailyData = useMemo(() => {
    const days = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayMonth = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      let completedGoals = 0;
      let totalCompletions = 0;
      
      goals.forEach(goal => {
        const completion = goal.completions.find(c => c.date === dateStr);
        if (completion && completion.count >= goal.targetCount) {
          completedGoals++;
        }
        if (completion) {
          totalCompletions += completion.count;
        }
      });
      
      const completionRate = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;
      
      days.push({
        date: dateStr,
        day: `${dayName} ${dayMonth}`,
        shortDay: dayName,
        completedGoals,
        totalGoals: goals.length,
        totalCompletions,
        completionRate
      });
    }
    
    return days;
  }, [goals]);

  // Calculate overall stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });
    
    const todayCompleted = goals.filter(goal => {
      const completion = goal.completions.find(c => c.date === today);
      return completion && completion.count >= goal.targetCount;
    }).length;
    
    const weeklyCompletions = last7Days.reduce((sum, date) => {
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
    
    return {
      todayCompleted,
      weeklyCompletions,
      currentStreak,
      totalGoals: goals.length
    };
  }, [goals]);

  // Add this useMemo to calculate yearly data, after your other useMemos
  const yearlyData = useMemo(() => {
    const years: { year: number; completions: number; possible: number; rate: number }[] = [];
    const now = new Date();
    for (let i = 2; i >= 0; i--) {
      const year = now.getFullYear() - i;
      let completions = 0;
      let possible = 0;
      goals.forEach(goal => {
        goal.completions.forEach(completion => {
          const compYear = new Date(completion.date).getFullYear();
          if (compYear === year && completion.count >= goal.targetCount) {
            completions++;
          }
        });
        // Assume possible completions = 365 per goal per year (or adjust as needed)
        possible += 365;
      });
      years.push({
        year,
        completions,
        possible,
        rate: possible > 0 ? Math.round((completions / possible) * 100) : 0,
      });
    }
    return years;
  }, [goals]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="size-8" />
        <div>
          <h1>Analytics</h1>
          <p className="text-muted-foreground">Track your goal completion patterns and progress over time</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              {stats.currentStreak === 1 ? 'day' : 'days'} in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCompleted}/{stats.totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              goals completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyCompletions}</div>
            <p className="text-xs text-muted-foreground">
              completions this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalGoals > 0 ? Math.round((stats.weeklyCompletions / (stats.totalGoals * 7)) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              last 7 days average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GitHub-style Contribution Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Goal Completion Activity
          </CardTitle>
          <CardDescription>
            Your daily goal completion activity over the past year. Darker squares indicate more goals completed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <ContributionCalendar 
              data={contributionData}
            />
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className="w-3 h-3"
                  style={{
                    backgroundColor: level === 0 ? '#ebedf0' : 
                                   level === 1 ? '#9be9a8' :
                                   level === 2 ? '#40c463' :
                                   level === 3 ? '#30a14e' : '#216e39'
                  }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Completion Trend</CardTitle>
            <CardDescription>
              Your goal completion rate over the past 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, 'Completion Rate']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Goals by Category</CardTitle>
            <CardDescription>
              Distribution of your goals across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value}/${props.payload.total}`,
                    'Completed/Total'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {categoryData.map((category, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Goals Completed */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Goals Completed</CardTitle>
            <CardDescription>
              Number of goals you completed each day over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="shortDay" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [`${value} goals`, 'Completed']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.day;
                    }
                    return label;
                  }}
                />
                <Bar dataKey="completedGoals" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Completion Rate</CardTitle>
            <CardDescription>
              Percentage of goals completed each day over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="shortDay" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, 'Completion Rate']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.day;
                    }
                    return label;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="completionRate" 
                  stroke="#ffc658" 
                  strokeWidth={3}
                  dot={{ fill: '#ffc658', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Daily Progress Overview
          </CardTitle>
          <CardDescription>
            Combined view of goals completed and completion rate over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="shortDay" 
                tick={{ fontSize: 12 }}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name, props) => {
                  if (name === 'completedGoals') {
                    return [`${value} goals`, 'Goals Completed'];
                  }
                  return [`${value}%`, 'Completion Rate'];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.day;
                  }
                  return label;
                }}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="completedGoals" 
                stackId="1"
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.6}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="completionRate" 
                stroke="#ffc658" 
                strokeWidth={3}
                dot={{ fill: '#ffc658', strokeWidth: 2, r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Yearly Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Yearly Completion Rate</CardTitle>
          <CardDescription>
            Your goal completion rate for each year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Bar dataKey="rate" fill="#8884d8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            {yearlyData.map((y) => (
              <div key={y.year}>
                <span className="font-semibold">{y.year}:</span> {y.rate}% ({y.completions}/{y.possible})
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}