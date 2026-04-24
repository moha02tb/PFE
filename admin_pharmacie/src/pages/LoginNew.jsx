/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const LoginNew = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const { language, setLanguage, languages, t } = useLanguage();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        setErrorMessage(t('login.emailRequired'));
        setIsLoading(false);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrorMessage(t('login.emailInvalid'));
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrorMessage(t('login.passwordShort'));
        setIsLoading(false);
        return;
      }

      const result = await login(email, password);
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('admin_user', JSON.stringify({ email, rememberMe }));
        }
        onLoginSuccess();
      } else {
        setErrorMessage(result.error || t('login.loginFailed'));
      }
    } catch (error) {
      const baseURL = error?.config?.baseURL;
      const isNetworkError = !error.response;
      const message =
        error.response?.data?.detail ||
        error.message ||
        (isNetworkError
          ? t('login.backendUnavailable', { baseURL: baseURL ? ` (${baseURL})` : '' })
          : null) ||
        t('login.unexpected');
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-split-shell">
      <section className="login-visual-panel">
        <div className="relative z-[1] flex h-full flex-col justify-between p-8 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-300" />
            <span className="font-display text-2xl font-bold tracking-tight">{t('common.appName')} {t('common.admin')}</span>
          </div>

          <div className="max-w-md">
            <p className="font-display text-2xl font-bold text-white/90">{t('login.heading')}</p>
            <p className="mt-4 text-sm leading-6 text-white/70">
              {t('login.description')}
            </p>
            <div className="mt-8 flex gap-8">
              <div className="flex flex-col">
                <span className="font-display text-4xl font-extrabold">99.9%</span>
                <span className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-white/50">{t('login.uptimeReliability')}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-4xl font-extrabold">ISO</span>
                <span className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-white/50">{t('login.certifiedSecurity')}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/40">
            © 2026 {t('common.appName')}. {t('common.allRightsReserved')}
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10 flex items-center gap-2 lg:hidden">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold text-primary">{t('common.appName')} {t('common.admin')}</span>
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t('login.signIn')}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('login.accessWorkspace')}</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {errorMessage ? (
              <div className="rounded-[8px] border border-danger/25 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{errorMessage}</div>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">{t('login.email')}</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoComplete="email"
                  className="login-input pl-12"
                  name="email"
                  placeholder="admin@pharmacieconnect.tn"
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </label>

            <label className="block">
              <div className="mb-2 flex items-center justify-between">
                <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">{t('login.password')}</span>
                <button type="button" className="text-xs font-bold text-primary hover:underline">{t('login.forgotPassword')}</button>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoComplete="current-password"
                  className="login-input pl-12 pr-12"
                  name="password"
                  placeholder="••••••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={t('login.togglePasswordVisibility')}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            <label className="flex cursor-pointer items-center">
              <input
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                checked={rememberMe}
                name="remember-me"
                type="checkbox"
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span className="ml-2 text-xs text-muted-foreground">{t('login.remember')}</span>
            </label>

            <button
              className="flex w-full justify-center rounded-[8px] bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              type="submit"
              disabled={!email || !password || isLoading}
            >
              {isLoading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-center text-xs leading-5 text-muted-foreground">
              {t('login.restrictedAccess')}
              <br className="hidden sm:block" />
              {t('login.agreePrefix')} <span className="font-bold text-foreground">{t('login.securityPolicy')}</span>.
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[0.6875rem] font-bold uppercase tracking-[0.08em]">
                <span className="bg-background px-4 text-muted-foreground">{t('login.orContinueWith')}</span>
              </div>
            </div>
            <button type="button" className="mt-6 flex w-full items-center justify-center gap-2 rounded-[8px] border border-border bg-surface-elevated px-4 py-2.5 text-sm font-bold text-foreground shadow-soft transition hover:bg-surface-muted">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {t('login.corporateSso')}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLanguage(item.code)}
                className={`rounded-[8px] border px-3 py-2 text-xs font-bold transition-smooth ${
                  language === item.code
                    ? 'border-primary/25 bg-primary-soft text-primary'
                    : 'border-border bg-surface text-muted-foreground hover:border-primary/25 hover:bg-surface-muted hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LoginNew;
