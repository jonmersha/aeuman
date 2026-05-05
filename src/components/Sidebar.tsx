import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Search, 
  Settings, 
  GraduationCap, 
  Users, 
  MessageSquare,
  LogOut,
  School as SchoolIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (t: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { profile, logout } = useAuth();
  
  const isSuperAdmin = profile?.role === 'super_admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(profile?.schoolId ? [{ id: 'my-school', label: 'My School', icon: SchoolIcon }] : []),
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'marketplace', label: 'Marketplace', icon: Search },
    ...(isSuperAdmin ? [{ id: 'super-admin', label: 'Super Admin Panel', icon: Settings }] : []),
    ...(profile?.role === 'admin' ? [{ id: 'school', label: 'School Manager Panel', icon: Settings }] : []),
    ...(profile?.role === 'teacher' ? [{ id: 'my-courses', label: 'Teaching', icon: GraduationCap }] : []),
    ...(profile?.role === 'parent' ? [{ id: 'parent', label: 'Parent Portal', icon: Users }] : []),
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 h-[calc(100vh-64px)] p-4 flex flex-col justify-between">
      <div className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === item.id 
                ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400" 
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-auto pt-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
