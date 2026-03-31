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
        className="lg:hidden fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full border border-slate-700 bg-slate-900 text-white shadow-lg flex items-center justify-center hover:bg-slate-800 transition"
      >
        <FiMenu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/55 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-64 bg-white backdrop-blur border-r border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.06)]
        rounded-r-3xl lg:rounded-3xl lg:my-3 lg:ml-3
        min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5.5rem)]
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
          <div className="mb-5 rounded-2xl border border-slate-100 bg-white px-3.5 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user?.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center ring-2 ring-slate-200">
                  <FiUser className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">{user?.role === 'admin' ? 'Admin Panel' : 'Student Area'}</p>
              </div>
            </div>
          </div>

          <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Navigation</p>
          <ul className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                      isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${
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
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
