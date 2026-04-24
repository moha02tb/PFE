/* eslint-disable react/prop-types */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Globe2,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Pill,
  Settings,
  ShieldAlert,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';

const groups = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Pharmacies', path: '/pharmacies', icon: Pill },
      { label: 'Management', path: '/management', icon: ClipboardList },
      { label: 'Calendar', path: '/calendar', icon: CalendarDays },
      { label: 'Map', path: '/map', icon: MapPinned },
      { label: 'Emergency', path: '/emergency', icon: ShieldAlert },
    ],
  },
  {
    label: 'Imports',
    items: [
      { label: 'Upload Pharmacies', path: '/upload-pharmacies', icon: Upload },
      { label: 'Upload Garde', path: '/upload-garde', icon: Upload },
      { label: 'Upload Medicines', path: '/upload-medicines', icon: Upload },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Notifications', path: '/notifications', icon: Bell },
      { label: 'Languages', path: '/languages', icon: Globe2 },
      { label: 'Settings', path: '/settings', icon: Settings },
      { label: 'Profile', path: '/profile', icon: UserRound },
    ],
  },
];

const groupLabelKey = {
  Operations: 'operations',
  Imports: 'imports',
  System: 'system',
};

const SidebarNew = ({ open, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarBody = (
    <div className="admin-sidebar flex h-full flex-col">
      <div className="flex items-start justify-between px-5 pb-7 pt-5">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary text-primary-foreground shadow-[0_14px_28px_oklch(var(--primary)/0.22)]">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-white">{t('common.appName')}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t('nav.controlCenter')}</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-white/[0.08] hover:text-white lg:hidden" onClick={onClose} aria-label={t('common.closeSidebar')}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-slate-500">
              {t(`nav.${groupLabelKey[group.label]}`)}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'admin-nav-link group flex items-center gap-3 rounded-[8px] px-3 py-3 text-sm font-medium tracking-wide transition-normal',
                      active
                        ? 'bg-primary/14 text-white shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.26)]'
                        : 'text-slate-400 hover:bg-white/[0.055] hover:text-white'
                    )}
                    data-active={active}
                  >
                    <Icon className={cn('h-5 w-5 flex-shrink-0', active ? 'text-primary' : item.path === '/emergency' ? 'text-red-400' : '')} />
                    <span className="truncate">
                      {item.path === '/dashboard'
                        ? t('nav.dashboard')
                        : item.path === '/pharmacies'
                          ? t('nav.pharmacies')
                          : item.path === '/management'
                            ? t('nav.management')
                            : item.path === '/calendar'
                              ? t('nav.calendar')
                              : item.path === '/map'
                                ? t('nav.map')
                                : item.path === '/emergency'
                                  ? t('nav.emergency')
                                  : item.path === '/upload-pharmacies'
                                    ? t('nav.uploadPharmacies')
                                    : item.path === '/upload-garde'
                                      ? t('nav.uploadGarde')
                                      : item.path === '/upload-medicines'
                                        ? t('nav.uploadMedicines')
                                        : item.path === '/notifications'
                                          ? t('nav.notifications')
                                          : item.path === '/languages'
                                            ? t('nav.languages')
                                            : item.path === '/settings'
                                              ? t('nav.settings')
                                              : t('nav.profile')}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto px-5 pb-5">
        <div className="mb-3 rounded-[8px] border border-white/10 bg-white/[0.055] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-slate-500">{t('common.live')}</span>
            <span className="live-dot h-2 w-2 rounded-full bg-primary shadow-[0_0_0_5px_oklch(var(--primary)/0.13)]" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="font-bold text-white">API</p>
              <p className="text-slate-400">{t('common.active')}</p>
            </div>
            <div>
              <p className="font-bold text-white">Sync</p>
              <p className="text-slate-400">{t('common.active')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[8px] border border-white/10 bg-slate-800/45 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-700 text-sm font-bold text-white">
              {user?.nomUtilisateur?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.nomUtilisateur || t('profile.adminUser')}</p>
              <p className="truncate text-xs capitalize text-slate-400">{user?.role || 'admin'}</p>
            </div>
            <Button variant="ghost" size="icon" className="flex-shrink-0 text-slate-400 hover:bg-white/10 hover:text-white" onClick={handleLogout} aria-label={t('common.signOut')}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/40 transition lg:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden={!open}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[272px] border-r border-white/10 transition-transform lg:static lg:z-auto lg:w-[264px] lg:translate-x-0 lg:bg-transparent',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarBody}
      </aside>
    </>
  );
};

export default SidebarNew;
