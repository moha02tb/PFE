/* eslint-disable react/prop-types */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  Globe2,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Pill,
  Settings,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const groups = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Pharmacies', path: '/pharmacies', icon: Pill },
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
    ],
  },
];

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
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-white shadow-soft ring-1 ring-white/10">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-white">{t('common.appName')}</p>
              <p className="text-xs text-slate-300">{t('nav.adminWorkspace')}</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-white/10 hover:text-white lg:hidden" onClick={onClose} aria-label="Close sidebar">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-5 py-4">
        <div className="rounded-3xl border border-white/10 bg-white/6 p-4 shadow-soft backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{t('nav.controlCenter')}</p>
              <p className="mt-1 text-xs text-slate-300">{t('nav.controlCenterDesc')}</p>
            </div>
            <Badge variant="primary" className="shadow-soft">{t('common.live')}</Badge>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              {group.label === 'Operations'
                ? t('nav.operations')
                : group.label === 'Imports'
                  ? t('nav.imports')
                  : t('nav.system')}
            </p>
            <div className="mt-3 space-y-1.5">
              {group.items.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition',
                      active
                        ? 'bg-white text-slate-950 shadow-card'
                        : 'text-slate-300 hover:bg-white/7 hover:text-white'
                    )}
                  >
                    <Icon className={cn('h-4.5 w-4.5', !active && 'text-slate-400 group-hover:text-white')} />
                    <span>
                      {item.path === '/dashboard'
                        ? t('nav.dashboard')
                        : item.path === '/pharmacies'
                          ? t('nav.pharmacies')
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
                                        : t('nav.settings')}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-3xl border border-white/10 bg-white/6 p-4 shadow-soft backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12 font-semibold text-white ring-1 ring-white/10">
              {user?.nomUtilisateur?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.nomUtilisateur || 'Admin User'}</p>
              <p className="truncate text-xs capitalize text-slate-300">{user?.role || 'admin'}</p>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={handleLogout} aria-label="Logout">
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
          'fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition lg:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden={!open}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[288px] border-r border-white/10 shadow-panel transition-transform lg:static lg:z-auto lg:w-[280px] lg:translate-x-0 lg:bg-transparent lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarBody}
      </aside>
    </>
  );
};

export default SidebarNew;
