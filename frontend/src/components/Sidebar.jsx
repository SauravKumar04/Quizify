import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiShield } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: FiShield },
  ];

  const userLinks = [
    { path: '/user/dashboard', label: 'Dashboard', icon: FiHome },
  ];

  const links = user?.role === 'admin' ? adminLinks : userLinks;

  return (
    <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <nav className="p-4">
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
  );
};

export default Sidebar;
