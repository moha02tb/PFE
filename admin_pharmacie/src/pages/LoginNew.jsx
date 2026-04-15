import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Badge, Button, Card, CardContent, Input } from '../components/ui';

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
          ? `Unable to reach backend API${baseURL ? ` (${baseURL})` : ''}. Check that the server is running and VITE_API_URL is correct.`
          : null) ||
        t('login.unexpected');
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_22rem),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.08),transparent_24rem)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-[0.95fr_0.75fr]">
        <div className="hidden lg:block">
          <Badge variant="primary">{t('login.badge')}</Badge>
          <h1 className="mt-6 max-w-xl font-display text-5xl font-semibold tracking-tight text-foreground">
            {t('login.heading')}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            {t('login.description')}
          </p>
          <div className="mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-surface-elevated p-5 shadow-soft">
              <ShieldCheck className="h-6 w-6 text-success" />
              <p className="mt-4 font-medium text-foreground">{t('login.roleProtected')}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t('login.roleProtectedDesc')}</p>
            </div>
            <div className="rounded-3xl border border-border bg-surface-elevated p-5 shadow-soft">
              <LockKeyhole className="h-6 w-6 text-primary" />
              <p className="mt-4 font-medium text-foreground">{t('login.tokenSupport')}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t('login.tokenSupportDesc')}</p>
            </div>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-md shadow-panel">
          <CardContent className="p-8 sm:p-10">
            <div className="mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-soft">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-semibold text-foreground">{t('login.signIn')}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t('login.accessWorkspace')}</p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              {errorMessage ? (
                <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{errorMessage}</div>
              ) : null}

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">{t('login.email')}</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="admin@pharmacieconnect.com"
                  />
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">{t('login.password')}</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <label className="flex items-center gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                {t('login.remember')}
              </label>

              <Button type="submit" className="w-full" disabled={!email || !password || isLoading}>
                {isLoading ? t('login.signingIn') : t('login.signIn')}
                {!isLoading ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </form>

            <div className="mt-8 border-t border-border pt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{t('login.interfaceLanguage')}</p>
              <div className="flex flex-wrap gap-2">
                {languages.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLanguage(item.code)}
                    className={`rounded-xl px-3 py-2 text-sm transition ${
                      language === item.code
                        ? 'bg-primary-soft text-primary'
                        : 'bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginNew;
