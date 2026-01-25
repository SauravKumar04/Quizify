import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiShield, FiAward, FiUser, FiMenu, FiX } from 'react-icons/fi';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: FiShield },
    { path: '/admin/contests', label: 'Contests', icon: FiAward },
  ];

  const userLinks = [
    { path: '/user/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/contests', label: 'Contests', icon: FiAward },
    { path: '/profile', label: 'Profile', icon: FiUser },
  ];

  const links = user?.role === 'admin' ? adminLinks : userLinks;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-50 w-12 h-12 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-800 transition"
      >
        <FiMenu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200 
        min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-4rem)]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:block
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900"
        >
          <FiX className="w-5 h-5" />
        </button>

        <nav className="p-4 pt-12 lg:pt-4">
          <div className="mb-6 px-4 py-3 bg-slate-100 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1 h-4 bg-slate-900 rounded-full"></span>
              <span className="text-sm font-semibold text-slate-900">Navigation</span>
            </div>
            <p className="text-xs text-slate-600">{user?.role === 'admin' ? 'Admin Panel' : 'User Panel'}</p>
          </div>

          <ul className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-slate-100 group-hover:bg-slate-200'
                    }`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-700'}`} />
                    </div>
                    <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>
                      {link.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Decorative Elements */}
          <div className="mt-8 px-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-slate-700 mb-2">
                <span className="w-1 h-3 bg-slate-900 rounded-full"></span>
                <span className="text-xs font-semibold">Quick Tip</span>
              </div>
              <p className="text-xs text-slate-600">
                {user?.role === 'admin' 
                  ? 'Create engaging quizzes with images and detailed explanations!' 
                  : 'Take quizzes to test your knowledge and track your progress!'}
              </p>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
