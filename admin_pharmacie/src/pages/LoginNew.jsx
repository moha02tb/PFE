import React, { useState } from 'react';
import { Icon } from '../components/common/IconHelper';
import { useAuth } from '../context/AuthContext';

const LoginNew = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [language, setLanguage] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setErrorMessage('Email and password are required');
        setIsLoading(false);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrorMessage('Please enter a valid email');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }

      // Call the login function from AuthContext
      const result = await login(email, password);

      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('admin_user', JSON.stringify({ email, rememberMe }));
        }
        onLoginSuccess();
      } else {
        setErrorMessage(result.error || 'Login failed. Please try again.');
        console.error('Login error:', result.error);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'An unexpected error occurred. Please try again.';
      setErrorMessage(errorMessage);
      console.error('Login error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 font-body text-slate-900 dark:text-white flex flex-col min-h-screen overflow-hidden">
      {/* Subtle Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] rounded-full bg-blue-600/5 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[35rem] h-[35rem] rounded-full bg-green-600/5 blur-[100px]"></div>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-[440px]">
          {/* Branding Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl shadow-lg mb-6">
              <Icon name="pharmacies" size={32} color="white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">PharmacieConnect</h1>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Admin Portal v2.0</p>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-8 md:p-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Secure Sign In</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Administrator Access</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-700">
                <Icon name="verified" size={14} color="rgb(22 163 74)" />
                <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-tight">Secure</span>
              </div>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleLogin}>
              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm font-medium">
                  {errorMessage}
                </div>
              )}
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <Icon 
                    name="search" 
                    size={18} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-body text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="admin@pharmacieconnect.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400" htmlFor="password">
                    Password
                  </label>
                  <a className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider hover:text-blue-700 dark:hover:text-blue-300" href="#forgot">
                    Forgot?
                  </a>
                </div>
                <div className="relative group">
                  <Icon 
                    name="closed" 
                    size={18} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-body text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <Icon name={showPassword ? "hide" : "view"} size={18} />
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer" htmlFor="remember">
                  Keep me signed in for 30 days
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={!email || !password || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-8"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <Icon name="next" size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Language Switcher */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Interface Language</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('English')}
                  className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-colors ${
                    language === 'English'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('Français')}
                  className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-colors ${
                    language === 'Français'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Français
                </button>
                <button
                  onClick={() => setLanguage('العربية')}
                  className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-colors ${
                    language === 'العربية'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>
          </div>

          {/* Security Footer */}
          <div className="mt-8 flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Icon name="verified" size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">HIPAA Compliant • AES-256 Encrypted</span>
            </div>
            <div className="flex gap-4 text-xs font-medium uppercase tracking-tight">
              <a className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" href="#security">
                Security
              </a>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <a className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" href="#privacy">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="w-full py-4 mt-auto text-center relative z-10 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
          © 2024 PharmacieConnect. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LoginNew;
