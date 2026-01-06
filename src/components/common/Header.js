import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, User } from 'lucide-react';

function Header() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            일손
          </Link>
          <nav className="flex gap-2">
            <Link
              to="/jobs"
              className={`p-2 rounded-lg ${isActive('/jobs') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            >
              <Briefcase size={24} />
            </Link>
            <Link
              to="/my"
              className={`p-2 rounded-lg ${isActive('/my') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            >
              <User size={24} />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
