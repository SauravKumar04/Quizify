import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiUser, FiShield } from 'react-icons/fi';
import { BsLightningFill } from 'react-icons/bs';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <BsLightningFill className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                Quizify
              </span>
            </Link>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User Badge */}
            {user?.role === 'admin' ? (
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-slate-50 rounded-lg border border-gray-200">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <FiShield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-600 capitalize flex items-center gap-1">
                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded-full text-[10px] font-bold">ADMIN</span>
                  </p>
                </div>
              </div>
            ) : (
              <Link 
                to="/profile"
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-slate-50 rounded-lg border border-gray-200 hover:bg-slate-100 transition"
              >
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.name} 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                    <FiUser className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-600 font-medium">User</p>
                </div>
              </Link>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-medium text-sm"
            >
              <FiLogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
