
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, LogOut, MessageSquare, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfileProps {
  user: any;
  onLogout: () => void;
  neonColor: string;
}

export function UserProfile({ user, onLogout, neonColor }: UserProfileProps) {
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    onLogout();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
  };

  const getUserInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full glass-morphism hover:bg-white/20">
          <Avatar className="h-10 w-10">
            <AvatarFallback 
              className="text-white font-semibold"
              style={{ backgroundColor: neonColor + '40' }}
            >
              {getUserInitials(user.username)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 glass-morphism border-white/20" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.username}</p>
            {user.email && (
              <p className="text-xs leading-none text-gray-400">{user.email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/20" />
        <DropdownMenuItem className="hover:bg-white/10">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-white/10">
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>My Conversations</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-white/10">
          <BarChart3 className="mr-2 h-4 w-4" />
          <span>Analytics</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-white/10">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/20" />
        <DropdownMenuItem className="hover:bg-white/10" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
