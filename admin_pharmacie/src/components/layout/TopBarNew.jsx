/* eslint-disable react/prop-types */
import { Bell, Circle, Globe2, LogOut, Menu, Moon, Search, Sun } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Dropdown, { DropdownItem } from '../ui/Dropdown';
import { Input } from '../ui/Input';

const TopBarNew = ({ onMenuClick, theme, onToggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, languages, t } = useLanguage();
  const titles = {
    '/dashboard': t('topbar.dashboard'),
    '/pharmacies': t('topbar.pharmacies'),
    '/management': t('topbar.management'),
    '/upload-pharmacies': t('topbar.uploadPharmacies'),
    '/upload-garde': t('topbar.uploadGarde'),
    '/upload-medicines': t('topbar.uploadMedicines'),
    '/calendar': t('topbar.calendar'),
    '/map': t('topbar.map'),
    '/emergency': t('topbar.emergency'),
    '/notifications': t('topbar.notifications'),
    '/languages': t('topbar.languages'),
    '/settings': t('topbar.settings'),
    '/profile': t('topbar.profile'),
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4 lg:px-5">
      <div className="admin-topbar flex min-h-[76px] items-center gap-3 border px-3 py-3 sm:px-4 lg:px-5">
        <Button variant="secondary" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label={t('common.openNavigation')}>
          <Menu className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <span className="hidden h-px w-8 bg-primary/60 sm:block" />
            {t('common.adminPanel')}
          </div>
          <h1 className="truncate font-display text-xl font-bold text-foreground">
            {titles[location.pathname] || t('common.adminWorkspace')}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden min-w-[260px] md:block xl:min-w-[360px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="bg-surface-elevated/90 pl-10 pr-3 shadow-soft placeholder:text-muted-foreground hover:border-primary/25 hover:bg-surface-elevated"
                placeholder={t('topbar.searchPlaceholder')}
              />
            </div>
          </div>

          <Badge variant="neutral" className="hidden lg:inline-flex">
            <Circle className="live-dot h-2.5 w-2.5 fill-primary text-primary" />
            {t('common.active')}
          </Badge>
          <Button variant="secondary" size="icon" onClick={onToggleTheme} aria-label={t('common.toggleTheme')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Dropdown
            trigger={
              <div>
                <Button variant="secondary" size="icon" aria-label={t('common.manageLanguages')} title={t('common.manageLanguages')}>
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
          <Button variant="secondary" size="icon" aria-label={t('nav.notifications')}>
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            className="hidden sm:inline-flex"
            onClick={handleSignOut}
            aria-label={t('common.signOut')}
          >
            <LogOut className="h-4 w-4" />
            {t('common.signOut')}
          </Button>

          <Dropdown
            trigger={
              <div
                role="button"
                tabIndex={0}
                className={cn(
                  'flex items-center gap-2 rounded-[10px] border border-border bg-surface-elevated px-2.5 py-1.5 text-left shadow-soft transition-smooth hover:border-primary/25 hover:bg-surface-muted hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]'
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-border bg-surface-muted text-xs font-bold text-foreground">
                  {user?.nomUtilisateur?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-sm font-semibold text-foreground">{user?.nomUtilisateur || t('profile.adminUser')}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.role || 'admin'}
                  </p>
                </div>
              </div>
            }
          >
            {({ close }) => (
              <>
                <DropdownItem
                  onClick={() => {
                    close();
                    navigate('/profile');
                  }}
                >
                  {t('common.profile')}
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    close();
                    navigate('/settings');
                  }}
                >
                  {t('common.preferences')}
                </DropdownItem>
                <DropdownItem
                  onClick={async () => {
                    close();
                    await handleSignOut();
                  }}
                  className="text-foreground"
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
