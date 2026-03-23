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

          {/* User Pill */}
          <div className="flex items-center rounded-xl border border-slate-300 bg-white px-1.5 sm:px-2 py-1.5 sm:py-2 shadow-sm">
            {user?.role === 'admin' ? (
              <div className="flex items-center gap-2 sm:gap-3 px-1.5 sm:px-2 rounded-lg">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-900 rounded-lg flex items-center justify-center ring-1 ring-slate-800/70">
                  <FiShield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</p>
                  <span className="inline-flex mt-0.5 px-2 py-0.5 bg-slate-900 text-white rounded-full text-[10px] font-bold tracking-wide">ADMIN</span>
                </div>
              </div>
            ) : (
              <Link
                to="/profile"
                className="flex items-center gap-2 sm:gap-3 px-1.5 sm:px-2 rounded-lg hover:bg-slate-100 transition"
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-1 ring-slate-300"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-900 rounded-lg flex items-center justify-center ring-1 ring-slate-800/70">
                    <FiUser className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</p>
                  <span className="inline-flex mt-0.5 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-[10px] font-semibold tracking-wide">USER</span>
                </div>
              </Link>
            )}

            <div className="mx-1 sm:mx-2 h-7 sm:h-8 w-px bg-slate-300"></div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-all font-medium text-sm"
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
