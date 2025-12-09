'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home,
  Search,
  Compass,
  Film,
  MessageCircle,
  Heart,
  PlusSquare,
  Bookmark,
  Menu,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { API_ROUTES } from '@/lib/constants';

export default function Sidebar() {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  const navigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = async () => {
    try {
      await axios.post(API_ROUTES.LOGOUT);
      logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      logout();
      router.push('/');
    }
    setShowUserMenu(false);
  };

  const menuItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Search, label: 'Search', path: '/home' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Film, label: 'Reels', path: '/home' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: PlusSquare, label: 'Create', path: '/form' },
    { icon: Bookmark, label: 'Saved', path: '/saved' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen w-64 xl:w-72 border-r border-gray-200 bg-white z-50 px-3 py-8">
        {/* Logo */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-3 px-3 mb-8 group"
        >
         
          <span className="text-2xl font-bold bg-gradient-to-r bg-black bg-clip-text text-transparent">
            Zoro
          </span>
        </button>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-4 w-full px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all group"
              >
                <Icon 
                  className="w-6 h-6 stroke-[2] group-hover:scale-110 transition-transform" 
                  strokeWidth={2}
                />
                <span className="text-[15px] font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Profile */}
          {isAuthenticated ? (
            <button
              onClick={() => navigate(`/profile/${user?.id}`)}
              className="flex items-center gap-4 w-full px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all group"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#743bc0] to-[#5a2ea0] flex items-center justify-center text-white text-xs font-semibold group-hover:scale-110 transition-transform">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-[15px] font-medium">Profile</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-4 w-full px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all group"
            >
              <User className="w-6 h-6 stroke-[2] group-hover:scale-110 transition-transform" />
              <span className="text-[15px] font-medium">Login</span>
            </button>
          )}
        </nav>

        {/* More Menu at bottom */}
        {isAuthenticated && (
          <div className="relative mt-auto">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-4 w-full px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all group"
            >
              <Menu className="w-6 h-6 stroke-[2] group-hover:scale-110 transition-transform" />
              <span className="text-[15px] font-medium">More</span>
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => navigate('/home')}
            className="flex flex-col items-center justify-center p-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Home className="w-6 h-6 stroke-[2]" />
          </button>

          <button
            onClick={() => navigate('/form')}
            className="flex flex-col items-center justify-center p-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <PlusSquare className="w-6 h-6 stroke-[2]" />
          </button>

          <button
            onClick={() => navigate('/messages')}
            className="flex flex-col items-center justify-center p-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <MessageCircle className="w-6 h-6 stroke-[2]" />
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => navigate(`/profile/${user?.id}`)}
              className="flex flex-col items-center justify-center p-2"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#743bc0] to-[#5a2ea0] flex items-center justify-center text-white text-xs font-semibold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex flex-col items-center justify-center p-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <User className="w-6 h-6 stroke-[2]" />
            </button>
          )}
        </div>
      </nav>
    </>
  );
}