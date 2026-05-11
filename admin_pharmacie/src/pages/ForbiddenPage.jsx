import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getDefaultRouteForUser } from '../lib/permissions';

const ForbiddenPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md rounded-[8px] border border-border bg-surface-elevated p-6 shadow-elevated">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[8px] bg-surface-muted text-foreground">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {t('common.accessDenied')}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-foreground">
          {t('common.noAccess')}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t('common.noAccessDesc')}
        </p>
        <Button asChild className="mt-6">
          <Link to={getDefaultRouteForUser(user)}>{t('common.goToWorkspace')}</Link>
        </Button>
      </div>
    </div>
  );
};

export default ForbiddenPage;
