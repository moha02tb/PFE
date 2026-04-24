import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Mail, Phone, Save, ShieldCheck, UserPen } from 'lucide-react';
import { Badge, Button, Field, FieldError, FieldHint, FieldLabel, Input, SectionHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const cleanPhone = (value) => value?.trim() || null;

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    nomUtilisateur: user?.nomUtilisateur || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [status, setStatus] = useState({ type: null, message: '' });
  const [saving, setSaving] = useState(false);

  const initials = useMemo(() => {
    const source = form.nomUtilisateur || form.email || 'Admin';
    return source
      .split(/[.\s_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'A';
  }, [form.email, form.nomUtilisateur]);

  const changed =
    form.nomUtilisateur !== (user?.nomUtilisateur || '') ||
    form.email !== (user?.email || '') ||
    cleanPhone(form.phone) !== cleanPhone(user?.phone || '');

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (status.type) {
      setStatus({ type: null, message: '' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nomUtilisateur.trim() || !form.email.trim()) {
      setStatus({ type: 'error', message: t('profile.requiredFields') });
      return;
    }

    setSaving(true);
    const result = await updateProfile({
      nomUtilisateur: form.nomUtilisateur.trim(),
      email: form.email.trim(),
      phone: cleanPhone(form.phone),
    });
    setSaving(false);

    if (result.success) {
      setForm({
        nomUtilisateur: result.user.nomUtilisateur || '',
        email: result.user.email || '',
        phone: result.user.phone || '',
      });
      setStatus({ type: 'success', message: t('profile.saved') });
      return;
    }

    setStatus({ type: 'error', message: result.error || t('profile.failed') });
  };

  return (
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow={t('profile.eyebrow')}
          title={t('profile.title')}
          description={t('profile.description')}
          actions={
            <Button form="admin-profile-form" type="submit" disabled={!changed || saving}>
              <Save className="h-4 w-4" />
              {saving ? t('profile.saving') : t('common.saveChanges')}
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.78fr_1.22fr]">
          <aside className="pulse-panel flex min-h-[420px] flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between gap-3">
                <Badge variant={user?.is_active === false ? 'warning' : 'success'}>
                  {user?.is_active === false ? t('profile.inactive') : t('profile.active')}
                </Badge>
                <ShieldCheck className="h-6 w-6 text-blue-200" />
              </div>

              <div className="mt-10 flex h-24 w-24 items-center justify-center rounded-[10px] border border-white/12 bg-white/[0.08] text-3xl font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                {initials}
              </div>

              <h2 className="mt-6 font-display text-2xl font-bold leading-tight text-white">
                {form.nomUtilisateur || t('profile.adminUser')}
              </h2>
              <p className="mt-2 break-all text-sm leading-6 text-slate-300">
                {form.email || t('profile.noEmail')}
              </p>
            </div>

            <div className="mt-8 grid gap-3">
              <div className="rounded-[8px] border border-white/10 bg-white/[0.055] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{t('profile.role')}</p>
                <p className="mt-1 text-sm font-semibold capitalize text-slate-100">{user?.role || 'admin'}</p>
              </div>
              <div className="rounded-[8px] border border-white/10 bg-white/[0.055] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{t('profile.accountId')}</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">#{user?.id || '--'}</p>
              </div>
            </div>
          </aside>

          <form id="admin-profile-form" onSubmit={handleSubmit} className="bento-card p-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">{t('profile.accountDetails')}</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{t('profile.accountDetailsDesc')}</p>
              </div>
              <Badge variant="primary">{t('common.adminOnly')}</Badge>
            </div>

            <div className="grid gap-5">
              <Field>
                <FieldLabel>{t('profile.username')}</FieldLabel>
                <div className="relative">
                  <UserPen className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.nomUtilisateur}
                    minLength={3}
                    maxLength={100}
                    onChange={(event) => updateField('nomUtilisateur', event.target.value)}
                    className="pl-10"
                  />
                </div>
                <FieldHint>{t('profile.usernameHint')}</FieldHint>
              </Field>

              <Field>
                <FieldLabel>{t('profile.email')}</FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    className="pl-10"
                  />
                </div>
                <FieldHint>{t('profile.emailHint')}</FieldHint>
              </Field>

              <Field>
                <FieldLabel>{t('profile.phone')}</FieldLabel>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={form.phone}
                    maxLength={30}
                    onChange={(event) => updateField('phone', event.target.value)}
                    className="pl-10"
                    placeholder="+216"
                  />
                </div>
                <FieldHint>{t('profile.phoneHint')}</FieldHint>
              </Field>

              {status.type ? (
                <div className={`flex items-start gap-3 rounded-[8px] border p-4 text-sm font-medium ${
                  status.type === 'success'
                    ? 'border-emerald-600/20 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200'
                    : 'border-red-600/20 bg-red-50 text-red-700 dark:border-red-300/20 dark:bg-red-400/10 dark:text-red-200'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                  <FieldError className="text-inherit">{status.message}</FieldError>
                </div>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
