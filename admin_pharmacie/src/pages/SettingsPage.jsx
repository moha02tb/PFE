import React, { useState } from 'react';
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Clock,
  Globe2,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserPen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Badge,
  Button,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  Input,
  SectionHeader,
  Select,
  Tabs,
} from '../components/ui';
import api from '../lib/api';

const cleanPhone = (value) => value?.trim() || null;

const StatusBanner = ({ type, message }) => (
  <div
    className={`flex items-start gap-3 rounded-[8px] border p-4 text-sm font-medium ${
      type === 'success'
        ? 'border-emerald-600/20 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200'
        : 'border-red-600/20 bg-red-50 text-red-700 dark:border-red-300/20 dark:bg-red-400/10 dark:text-red-200'
    }`}
  >
    {type === 'success' ? (
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
    ) : (
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
    )}
    <FieldError className="text-inherit">{message}</FieldError>
  </div>
);

const GeneralTab = ({ t, setLanguage, language }) => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    nomUtilisateur: user?.nomUtilisateur || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [status, setStatus] = useState({ type: null, message: '' });
  const [saving, setSaving] = useState(false);

  const changed =
    form.nomUtilisateur !== (user?.nomUtilisateur || '') ||
    form.email !== (user?.email || '') ||
    cleanPhone(form.phone) !== cleanPhone(user?.phone || '');

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (status.type) setStatus({ type: null, message: '' });
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
    } else {
      setStatus({ type: 'error', message: result.error || t('profile.failed') });
    }
  };

  return (
    <div className="grid gap-8">
      <form id="settings-profile-form" onSubmit={handleSubmit} className="grid gap-5">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{t('settings.profileSection')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('settings.profileSectionDesc')}</p>
        </div>

        <Field>
          <FieldLabel>{t('profile.username')}</FieldLabel>
          <div className="relative">
            <UserPen className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={form.nomUtilisateur}
              minLength={3}
              maxLength={100}
              onChange={(e) => updateField('nomUtilisateur', e.target.value)}
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
              onChange={(e) => updateField('email', e.target.value)}
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
              onChange={(e) => updateField('phone', e.target.value)}
              className="pl-10"
              placeholder="+216"
            />
          </div>
          <FieldHint>{t('profile.phoneHint')}</FieldHint>
        </Field>

        {status.type ? <StatusBanner type={status.type} message={status.message} /> : null}

        <div>
          <Button type="submit" disabled={!changed || saving}>
            <Save className="h-4 w-4" />
            {saving ? t('profile.saving') : t('common.saveChanges')}
          </Button>
        </div>
      </form>

      <div className="border-t border-border pt-6 grid gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{t('settings.interfaceLanguage')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('settings.interfaceLanguageDesc')}</p>
        </div>
        <Field>
          <FieldLabel>{t('settings.defaultLanguage')}</FieldLabel>
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </Select>
        </Field>
      </div>
    </div>
  );
};

const SecurityTab = ({ t }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState({ type: null, message: '' });
  const [saving, setSaving] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (status.type) setStatus({ type: null, message: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.newPassword.length < 6) {
      setStatus({ type: 'error', message: t('settings.passwordTooShort') });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setStatus({ type: 'error', message: t('settings.passwordsNoMatch') });
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/auth/me/password', {
        current_password: form.currentPassword,
        new_password: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setStatus({ type: 'success', message: t('settings.passwordSaved') });
    } catch (err) {
      const message =
        err.response?.data?.detail || err.message || t('settings.passwordFailed');
      setStatus({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">{t('settings.changePassword')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('settings.changePasswordDesc')}</p>
      </div>

      <Field>
        <FieldLabel>{t('settings.currentPassword')}</FieldLabel>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="password"
            value={form.currentPassword}
            onChange={(e) => updateField('currentPassword', e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </Field>

      <Field>
        <FieldLabel>{t('settings.newPassword')}</FieldLabel>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="password"
            value={form.newPassword}
            onChange={(e) => updateField('newPassword', e.target.value)}
            className="pl-10"
            minLength={6}
            required
          />
        </div>
      </Field>

      <Field>
        <FieldLabel>{t('settings.confirmPassword')}</FieldLabel>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            className="pl-10"
            minLength={6}
            required
          />
        </div>
      </Field>

      {status.type ? <StatusBanner type={status.type} message={status.message} /> : null}

      <div>
        <Button type="submit" disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}>
          <Save className="h-4 w-4" />
          {saving ? t('settings.changingPassword') : t('settings.changePassword')}
        </Button>
      </div>
    </form>
  );
};

const SettingsPage = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const [tab, setTab] = useState('general');

  return (
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow={t('settings.eyebrow')}
          title={t('settings.title')}
          description={t('settings.description')}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'general', label: t('settings.general') },
              { value: 'notifications', label: t('settings.notifications') },
              { value: 'security', label: t('settings.security') },
            ]}
          />
          <Badge variant="success">{t('common.adminOnly')}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="bento-card p-6">
            {tab === 'general' && (
              <GeneralTab t={t} language={language} setLanguage={setLanguage} />
            )}

            {tab === 'notifications' && (
              <div className="grid gap-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{t('settings.notificationControls')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('settings.notificationControlsDesc')}</p>
                </div>
                <Field>
                  <FieldLabel>{t('settings.emailAlerts')}</FieldLabel>
                  <Select defaultValue="enabled">
                    <option value="enabled">{t('settings.enabled')}</option>
                    <option value="digest">{t('settings.dailyDigest')}</option>
                    <option value="disabled">{t('settings.disabled')}</option>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>{t('settings.criticalIncidentChannel')}</FieldLabel>
                  <Input value="ops-alerts@pharmacieconnect.tn" readOnly />
                </Field>
              </div>
            )}

            {tab === 'security' && <SecurityTab t={t} />}
          </div>

          <div className="grid gap-6">
            <div className="pulse-panel p-6">
              <ShieldCheck className="h-7 w-7 text-blue-300" />
              <h2 className="mt-5 font-display text-xl font-bold text-white">{t('settings.environmentSummary')}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t('settings.environmentSummaryDesc')}</p>
              <div className="mt-6 space-y-3">
                <div className="rounded-[8px] border border-white/10 bg-white/[0.055] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{t('settings.localization')}</p>
                  <p className="mt-1 text-sm text-slate-200">{t('settings.localizationDesc')}</p>
                </div>
                <div className="rounded-[8px] border border-white/10 bg-white/[0.055] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{t('settings.securityPosture')}</p>
                  <p className="mt-1 text-sm text-slate-200">{t('settings.securityPostureDesc')}</p>
                </div>
              </div>
            </div>

            <div className="bento-card p-6">
              <h2 className="font-display text-base font-bold text-foreground">{t('settings.policySummary')}</h2>
              <div className="mt-5 grid gap-3">
                <div className="flex items-center gap-3 rounded-[8px] bg-surface-muted p-4 text-sm font-semibold text-foreground">
                  <Globe2 className="h-4 w-4 text-primary" />
                  {user?.email || '—'}
                </div>
                <div className="flex items-center gap-3 rounded-[8px] bg-surface-muted p-4 text-sm font-semibold text-foreground">
                  <BellRing className="h-4 w-4 text-primary" />
                  {t('settings.alerts')}: {t('settings.enabled')}
                </div>
                <div className="flex items-center gap-3 rounded-[8px] bg-surface-muted p-4 text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  {t('settings.session')}: {t('settings.minutes30')}
                </div>
                <div className="flex items-center gap-3 rounded-[8px] bg-surface-muted p-4 text-sm font-semibold text-foreground">
                  <LockKeyhole className="h-4 w-4 text-primary" />
                  {t('settings.tokenRefreshOn401')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
