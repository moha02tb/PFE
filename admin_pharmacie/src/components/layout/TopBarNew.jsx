/* eslint-disable react/prop-types */
import { Bell, Globe2, Menu, Moon, Search, Sparkles, Sun } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';
import Dropdown, { DropdownItem } from '../ui/Dropdown';
import { Input } from '../ui/Input';

const TopBarNew = ({ onMenuClick, theme, onToggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentLanguage, language, setLanguage, languages, t } = useLanguage();
  const titles = {
    '/dashboard': t('topbar.dashboard'),
    '/pharmacies': t('topbar.pharmacies'),
    '/upload-pharmacies': t('topbar.uploadPharmacies'),
    '/upload-garde': t('topbar.uploadGarde'),
    '/upload-medicines': t('topbar.uploadMedicines'),
    '/calendar': t('topbar.calendar'),
    '/map': t('topbar.map'),
    '/emergency': t('topbar.emergency'),
    '/notifications': t('topbar.notifications'),
    '/languages': t('topbar.languages'),
    '/settings': t('topbar.settings'),
  };

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="admin-topbar flex min-h-[88px] items-center gap-4 rounded-[28px] border border-white/10 px-4 py-4 shadow-soft sm:px-5 lg:px-6">
        <Button variant="secondary" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open navigation">
          <Menu className="h-4 w-4" />
        </Button>

        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t('common.adminPanel')}
          </div>
          <h1 className="truncate font-display text-xl font-semibold text-foreground">
            {titles[location.pathname] || t('common.adminWorkspace')}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden min-w-[280px] lg:block xl:min-w-[360px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="border-white/10 bg-white/70 pl-9 shadow-none backdrop-blur-sm dark:bg-slate-950/30" placeholder={t('topbar.searchPlaceholder')} />
            </div>
          </div>

          <Button variant="secondary" size="icon" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="secondary" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <Dropdown
            trigger={
              <div>
                <Button variant="secondary" size="icon" aria-label="Languages">
                  <Globe2 className="h-4 w-4" />
                </Button>
              </div>
            }
          >
            {({ close }) => (
              <>
                {languages.map((item) => (
                  <DropdownItem
                    key={item.code}
                    onClick={() => {
                      setLanguage(item.code);
                      close();
                    }}
                    className={language === item.code ? 'bg-surface-muted text-foreground' : ''}
                  >
                    {item.label}
                  </DropdownItem>
                ))}
                <DropdownItem
                  onClick={() => {
                    close();
                    navigate('/languages');
                  }}
                >
                  {t('common.manageLanguages')}
                </DropdownItem>
              </>
            )}
          </Dropdown>

          <Dropdown
            trigger={
              <div
                role="button"
                tabIndex={0}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border border-white/10 bg-white/75 px-3 py-2 text-left shadow-none transition hover:bg-white dark:bg-slate-950/30 dark:hover:bg-slate-950/50'
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                  {user?.nomUtilisateur?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-sm font-medium text-foreground">{user?.nomUtilisateur || 'Admin User'}</p>
                  <p className="truncate text-xs capitalize text-muted-foreground">
                    {user?.role || 'admin'} · {currentLanguage.label}
                  </p>
                </div>
              </div>
            }
          >
            {({ close }) => (
              <>
                <DropdownItem onClick={() => close()}>{t('common.profile')}</DropdownItem>
                <DropdownItem onClick={() => close()}>{t('common.preferences')}</DropdownItem>
                <DropdownItem
                  onClick={async () => {
                    close();
                    await logout();
                    window.location.href = '/login';
                  }}
                  className="text-danger hover:text-danger"
                >
                  {t('common.signOut')}
                </DropdownItem>
              </>
            )}
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default TopBarNew;
