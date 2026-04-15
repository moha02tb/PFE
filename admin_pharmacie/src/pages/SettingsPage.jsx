import React, { useState } from 'react';
import { BellRing, Globe2, LockKeyhole, Save, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldHint,
  FieldLabel,
  Input,
  SectionHeader,
  Select,
  Tabs,
} from '../components/ui';

const SettingsPage = () => {
  const { t, setLanguage } = useLanguage();
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState({
    workspaceName: 'PharmacieConnect Admin',
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

        {tab === 'general' ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t('settings.workspaceSettings')}</CardTitle>
                  <CardDescription>{t('settings.workspaceSettingsDesc')}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t('settings.environmentSummary')}</CardTitle>
                  <CardDescription>{t('settings.environmentSummaryDesc')}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="rounded-2xl bg-surface-muted p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary-soft p-3 text-primary"><Globe2 className="h-5 w-5" /></div>
                    <div>
                      <p className="font-medium text-foreground">{t('settings.localization')}</p>
                      <p className="text-sm text-muted-foreground">{t('settings.localizationDesc')}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-surface-muted p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-success-soft p-3 text-success"><ShieldCheck className="h-5 w-5" /></div>
                    <div>
                      <p className="font-medium text-foreground">{t('settings.securityPosture')}</p>
                      <p className="text-sm text-muted-foreground">{t('settings.securityPostureDesc')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {tab === 'notifications' ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t('settings.notificationControls')}</CardTitle>
                  <CardDescription>{t('settings.notificationControlsDesc')}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5">
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
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="rounded-3xl bg-warning-soft p-6">
                  <BellRing className="h-6 w-6 text-warning" />
                  <h3 className="mt-4 font-display text-xl font-semibold text-foreground">{t('settings.alertHygiene')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t('settings.alertHygieneDesc')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {tab === 'security' ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t('settings.sessionPolicy')}</CardTitle>
                  <CardDescription>{t('settings.sessionPolicyDesc')}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5">
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
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="rounded-3xl bg-danger-soft p-6">
                  <LockKeyhole className="h-6 w-6 text-danger" />
                  <h3 className="mt-4 font-display text-xl font-semibold text-foreground">{t('settings.accessControl')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t('settings.accessControlDesc')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SettingsPage;
