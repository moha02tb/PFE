import React, { useState } from 'react';
import { BellRing, Clock, Globe2, LockKeyhole, Save, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Badge, Button, Field, FieldHint, FieldLabel, Input, SectionHeader, Select, Tabs } from '../components/ui';

const SettingsPage = () => {
  const { t, setLanguage } = useLanguage();
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState({
    workspaceName: 'HealthAdmin',
    timezone: 'Africa/Tunis',
    locale: 'en',
    emailAlerts: 'enabled',
    sessionTimeout: '30',
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow={t('settings.eyebrow')}
          title={t('settings.title')}
          description={t('settings.description')}
          actions={
            <Button>
              <Save className="h-4 w-4" />
              {t('common.saveChanges')}
            </Button>
          }
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
            {tab === 'general' ? (
              <div className="grid gap-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{t('settings.workspaceSettings')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('settings.workspaceSettingsDesc')}</p>
                </div>
                <Field>
                  <FieldLabel>{t('settings.workspaceName')}</FieldLabel>
                  <Input value={form.workspaceName} onChange={(event) => update('workspaceName', event.target.value)} />
                </Field>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field>
                    <FieldLabel>{t('settings.timezone')}</FieldLabel>
                    <Select value={form.timezone} onChange={(event) => update('timezone', event.target.value)}>
                      <option value="Africa/Tunis">Africa/Tunis</option>
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="UTC">UTC</option>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>{t('settings.defaultLanguage')}</FieldLabel>
                    <Select value={form.locale} onChange={(event) => { update('locale', event.target.value); setLanguage(event.target.value); }}>
                      <option value="en">English</option>
                      <option value="fr">Francais</option>
                      <option value="ar">العربية</option>
                    </Select>
                  </Field>
                </div>
                <Field>
                  <FieldLabel>{t('settings.retentionNote')}</FieldLabel>
                  <Input value={t('settings.retentionValue')} readOnly />
                  <FieldHint>{t('settings.retentionHint')}</FieldHint>
                </Field>
              </div>
            ) : null}

            {tab === 'notifications' ? (
              <div className="grid gap-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{t('settings.notificationControls')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('settings.notificationControlsDesc')}</p>
                </div>
                <Field>
                  <FieldLabel>{t('settings.emailAlerts')}</FieldLabel>
                  <Select value={form.emailAlerts} onChange={(event) => update('emailAlerts', event.target.value)}>
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
            ) : null}

            {tab === 'security' ? (
              <div className="grid gap-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{t('settings.sessionPolicy')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('settings.sessionPolicyDesc')}</p>
                </div>
                <Field>
                  <FieldLabel>{t('settings.sessionTimeout')}</FieldLabel>
                  <Select value={form.sessionTimeout} onChange={(event) => update('sessionTimeout', event.target.value)}>
                    <option value="15">{t('settings.minutes15')}</option>
                    <option value="30">{t('settings.minutes30')}</option>
                    <option value="60">{t('settings.minutes60')}</option>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>{t('settings.tokenRefreshStrategy')}</FieldLabel>
                  <Input value={t('settings.automaticOn401')} readOnly />
                </Field>
              </div>
            ) : null}
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
                  {form.timezone}
                </div>
                <div className="flex items-center gap-3 rounded-[8px] bg-surface-muted p-4 text-sm font-semibold text-foreground">
                  <BellRing className="h-4 w-4 text-primary" />
                  {t('settings.alerts')}: {t(`settings.${form.emailAlerts}`)}
                </div>
                <div className="flex items-center gap-3 rounded-[8px] bg-surface-muted p-4 text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  {t('settings.session')}: {t(`settings.minutes${form.sessionTimeout}`)}
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
