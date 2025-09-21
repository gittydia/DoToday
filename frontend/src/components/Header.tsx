import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Plus, Target, Settings, LogOut, Moon, Sun, Menu, Home, BarChart3, Users } from "lucide-react";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogin: () => void;
  onLogout: () => void;
  onNewGoal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentView: 'dashboard' | 'analytics' | 'social' | 'profile';
  onViewChange: (view: 'dashboard' | 'analytics' | 'social' | 'profile') => void;
}

export function Header({ user, onLogin, onLogout, onNewGoal, darkMode, onToggleDarkMode, currentView, onViewChange }: HeaderProps) {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'social', label: 'Community', icon: Users },
  ];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Target className="size-6" />
            <span className="font-semibold">DoToday</span>
          </div>
          
          {user && (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-4">
                {navigationItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <Button 
                      key={item.id}
                      variant={currentView === item.id ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => onViewChange(item.id as any)}
                      className="gap-2"
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Button>
                  );
                })}
                <Button 
                  variant={currentView === 'profile' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => onViewChange('profile')}
                >
                  Profile
                </Button>
              </nav>

              {/* Mobile Navigation */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="size-4" />
                    <span className="sr-only">Open navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Target className="size-6" />
                      DoToday
                    </SheetTitle>
                    <SheetDescription>
                      Navigate to different sections of the app
                    </SheetDescription>
                  </SheetHeader>
                  <nav className="flex flex-col gap-4 mt-6">
                    {navigationItems.map(item => {
                      const Icon = item.icon;
                      return (
                        <Button 
                          key={item.id}
                          variant={currentView === item.id ? 'default' : 'ghost'} 
                          size="lg"
                          onClick={() => onViewChange(item.id as any)}
                          className="gap-2 justify-start"
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </Button>
                      );
                    })}
                    <Button 
                      variant={currentView === 'profile' ? 'default' : 'ghost'} 
                      size="lg"
                      onClick={() => onViewChange('profile')}
                      className="gap-2 justify-start"
                    >
                      <Settings className="size-4" />
                      Profile
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDarkMode}
            className="p-2"
          >
            {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          {user ? (
            <>
              <Button onClick={onNewGoal} size="sm" className="gap-2 hidden sm:flex">
                <Plus className="size-4" />
                New Goal
              </Button>
              
              <Button onClick={onNewGoal} size="sm" className="p-2 sm:hidden">
                <Plus className="size-4" />
                <span className="sr-only">New Goal</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="font-medium leading-none">{user.name}</p>
                    <p className="text-muted-foreground text-xs leading-none">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onViewChange('profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={onLogin} size="sm">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}