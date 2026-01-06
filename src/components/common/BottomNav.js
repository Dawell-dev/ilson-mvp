import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, User } from 'lucide-react';

function BottomNav() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { path: '/', icon: Home, label: '홈' },
    { path: '/jobs', icon: Briefcase, label: '일자리' },
    { path: '/my', icon: User, label: '내정보' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 z-50 shadow-lg">
      <div className="max-w-md mx-auto flex justify-around py-3">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center py-3 px-6 rounded-xl min-w-[90px] ${
              isActive(path)
                ? 'text-orange-500 bg-orange-50'
                : 'text-gray-500'
            }`}
          >
            <Icon size={32} strokeWidth={isActive(path) ? 2.5 : 2} />
            <span className="text-lg mt-1 font-bold">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
