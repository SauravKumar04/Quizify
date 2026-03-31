import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiUser, FiChevronDown } from 'react-icons/fi';
import { BsLightningFill } from 'react-icons/bs';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-17">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to={user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'}
              className="flex items-center gap-2.5 sm:gap-3 group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-slate-800/70">
                <BsLightningFill className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 group-hover:text-black transition-colors">
                Quizify
              </span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="group flex items-center gap-2 rounded-full border border-slate-300 bg-white py-1.5 pl-1.5 pr-2 shadow-sm hover:shadow transition"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user?.name || 'User'}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-slate-200"
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 flex items-center justify-center ring-2 ring-slate-200">
                  <FiUser className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="hidden sm:block text-left pr-0.5">
                <p className="text-xs font-semibold text-slate-900 leading-tight max-w-28 truncate">{user?.name}</p>
              </div>

              <FiChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5 z-50">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                </div>

                {user?.role !== 'admin' && (
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <FiUser className="w-4 h-4" />
                    Profile
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <FiLogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
