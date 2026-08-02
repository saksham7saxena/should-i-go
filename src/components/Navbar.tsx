import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Settings, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { hasCompletedOnboarding } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#f5f5f5]/90 backdrop-blur-md border-b border-[#e7e5e4]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-[#0c0a09] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif text-lg font-normal tracking-tight text-[#0c0a09] group-hover:text-black transition-colors">
            Should I Go?
          </span>
        </Link>

        {/* Consumer Navigation: Saved & Preferences */}
        <nav className="flex items-center gap-2">
          <Link
            to="/events"
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              isActive('/events')
                ? 'bg-[#0c0a09] text-white shadow-xs font-semibold'
                : 'text-[#4e4e4e] hover:text-[#0c0a09] hover:bg-[#e7e5e4]/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Saved</span>
          </Link>

          <Link
            to={hasCompletedOnboarding ? '/settings' : '/onboarding'}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              isActive('/settings') || isActive('/onboarding')
                ? 'bg-[#0c0a09] text-white shadow-xs font-semibold'
                : 'text-[#4e4e4e] hover:text-[#0c0a09] hover:bg-[#e7e5e4]/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
