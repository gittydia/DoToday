import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import type { Goal } from "./GoalCard";
import { Users, Share2, Heart, MessageCircle, Trophy, Target, Calendar, TrendingUp, Plus } from "lucide-react";
import { toast } from "sonner";

interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  goalTitle?: string;
  goalCategory?: string;
  achievement?: {
    type: 'streak' | 'completion' | 'milestone';
    value: number;
    description: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface SocialProps {
  user: User;
  goals: Goal[];
  onViewProfile: (userId: string) => void;
}

export function Social({ user, goals, onViewProfile }: SocialProps) {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'Alex Johnson',
      userAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AlexJohnson',
      content: 'Just completed my 30-day meditation streak! 🧘‍♂️ Feeling more focused and calm than ever.',
      goalTitle: 'Daily Meditation',
      goalCategory: 'personal',
      achievement: {
        type: 'streak',
        value: 30,
        description: '30-day meditation streak'
      },
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      likes: 12,
      comments: 3,
      isLiked: false
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Sarah Chen',
      userAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=SarahChen',
      content: 'Reading milestone achieved! 📚 Just finished my 5th book this month. Currently reading "Atomic Habits" - highly recommend!',
      goalTitle: 'Read for 30 minutes',
      goalCategory: 'learning',
      achievement: {
        type: 'milestone',
        value: 5,
        description: '5 books completed this month'
      },
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      likes: 18,
      comments: 5,
      isLiked: true
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Mike Rodriguez',
      userAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=MikeRodriguez',
      content: 'Crushed my fitness goal today! 💪 Hit the gym for an intense workout session. Consistency is key!',
      goalTitle: 'Exercise',
      goalCategory: 'health',
      achievement: {
        type: 'completion',
        value: 1,
        description: 'Daily exercise completed'
      },
      createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      likes: 8,
      comments: 2,
      isLiked: false
    }
  ]);

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareContent, setShareContent] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Get today's completed goals
  const todayCompletedGoals = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return goals.filter(goal => {
      const completion = goal.completions.find(c => c.date === today);
      return completion && completion.count >= goal.targetCount;
    });
  }, [goals]);

  // Calculate user stats
  const userStats = useMemo(() => {
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

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handleShare = () => {
    if (!shareContent.trim()) {
      toast.error("Please enter some content to share");
      return;
    }

    const newPost: Post = {
      id: Date.now().toString(),
      userId: user.email,
      userName: user.name,
      userAvatar: user.avatar,
      content: shareContent,
      goalTitle: selectedGoal?.title,
      goalCategory: selectedGoal?.category,
      achievement: selectedGoal ? {
        type: 'completion',
        value: 1,
        description: `Completed ${selectedGoal.title}`
      } : undefined,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      isLiked: false
    };

    setPosts([newPost, ...posts]);
    setShareContent('');
    setSelectedGoal(null);
    setShowShareDialog(false);
    toast.success("Goal shared successfully!");
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'health': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'learning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'personal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'work': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'streak': return Trophy;
      case 'completion': return Target;
      case 'milestone': return TrendingUp;
      default: return Trophy;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="size-8" />
          <div>
            <h1>Community</h1>
            <p className="text-muted-foreground">Share your progress and get inspired by others</p>
          </div>
        </div>

        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Share2 className="size-4" />
              Share Progress
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Your Progress</DialogTitle>
              <DialogDescription>
                Share your goal completion with the community
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="What goal did you complete today? Share your thoughts..."
                value={shareContent}
                onChange={(e) => setShareContent(e.target.value)}
                className="min-h-[100px]"
              />
              
              {todayCompletedGoals.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Completed goals today:</label>
                  <div className="grid gap-2">
                    {todayCompletedGoals.map(goal => (
                      <Button
                        key={goal.id}
                        variant={selectedGoal?.id === goal.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedGoal(selectedGoal?.id === goal.id ? null : goal)}
                        className="justify-start gap-2"
                      >
                        <Target className="size-4" />
                        <span className="truncate">{goal.title}</span>
                        <Badge variant="secondary" className={getCategoryColor(goal.category)}>
                          {goal.category}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleShare}>
                  Share
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Stats Card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-lg">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <CardDescription>Your progress today</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{userStats.todayCompleted}</div>
              <div className="text-sm text-muted-foreground">Goals Today</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{userStats.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{userStats.weeklyCompletions}</div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{userStats.totalGoals}</div>
              <div className="text-sm text-muted-foreground">Total Goals</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Feed */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Community Feed</h2>
        
        {posts.map(post => {
          const AchievementIcon = post.achievement ? getAchievementIcon(post.achievement.type) : Trophy;
          
          return (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Post Header */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-10 w-10 cursor-pointer" onClick={() => onViewProfile(post.userId)}>
                    <AvatarImage src={post.userAvatar} alt={post.userName} />
                    <AvatarFallback>{post.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 
                        className="font-semibold cursor-pointer hover:underline" 
                        onClick={() => onViewProfile(post.userId)}
                      >
                        {post.userName}
                      </h3>
                      <span className="text-muted-foreground text-sm">
                        {formatTimeAgo(post.createdAt)}
                      </span>
                    </div>
                    
                    {post.goalTitle && (
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="size-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{post.goalTitle}</span>
                        {post.goalCategory && (
                          <Badge variant="secondary" className={getCategoryColor(post.goalCategory)}>
                            {post.goalCategory}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Achievement Badge */}
                {post.achievement && (
                  <div className="mb-4 p-3 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                    <div className="flex items-center gap-2">
                      <AchievementIcon className="size-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800 dark:text-yellow-200">
                        Achievement Unlocked!
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      {post.achievement.description}
                    </p>
                  </div>
                )}

                {/* Post Content */}
                <p className="text-base mb-4">{post.content}</p>

                {/* Post Actions */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={`gap-2 ${post.isLiked ? 'text-red-600' : ''}`}
                  >
                    <Heart className={`size-4 ${post.isLiked ? 'fill-current' : ''}`} />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="size-4" />
                    {post.comments}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Share2 className="size-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}