import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { BsLightningFill } from 'react-icons/bs';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success('Welcome back!');
      if (result.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } else {
      setError(result.message);
      toast.error(result.message || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Branding Side */}
          <div className="hidden lg:flex bg-slate-900 p-12 flex-col justify-center items-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-slate-800 to-slate-900"></div>
            <div className="relative z-10 text-center">
              <div className="flex justify-center mb-8">
                <div className="relative group">
                  <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                    <BsLightningFill className="w-12 h-12 text-slate-900" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-slate-900"></div>
                </div>
              </div>
              <h1 className="text-5xl font-bold mb-4 tracking-tight">
                Quizify
              </h1>
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="h-px w-12 bg-slate-600"></div>
                <p className="text-sm font-medium text-slate-300 uppercase tracking-wider">Test Your Knowledge</p>
                <div className="h-px w-12 bg-slate-600"></div>
              </div>
              <p className="text-slate-300 text-lg max-w-sm mx-auto">
                Join thousands of learners testing their knowledge with interactive quizzes
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-8 sm:p-12 lg:p-16">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                  <BsLightningFill className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Quizify</h1>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-slate-600">
                Sign in to continue your learning journey
              </p>
            </div>
          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 sm:py-3.5 border border-gray-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-sm sm:text-base"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 sm:py-3.5 border border-gray-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-sm sm:text-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-2 py-3 sm:py-3.5 px-4 border border-transparent text-sm sm:text-base font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <FiArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">New to Quizify?</span>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className="mt-4 w-full flex justify-center items-center gap-2 py-3 px-4 border-2 border-gray-200 text-sm font-semibold rounded-lg text-slate-700 hover:border-slate-900 hover:bg-slate-50 transition-all"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Login;
