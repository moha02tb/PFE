import React from 'react';
import { Ambulance, BellRing, PhoneCall, RadioTower, ShieldAlert, Siren, Users } from 'lucide-react';
import { Badge, Button, SectionHeader } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';

const EmergencyPage = () => {
  const { t } = useLanguage();
  const responseStats = [
    [t('emergency.responseLead'), t('emergency.operationsDesk'), Users],
    [t('emergency.hotline'), '+216 71 000 000', PhoneCall],
    [t('emergency.broadcast'), t('emergency.inAppEmail'), RadioTower],
  ];
  const channels = [
    [t('emergency.immediateAlerts'), t('emergency.ready'), BellRing, 'success'],
    [t('emergency.regionalResponse'), t('emergency.standby'), Ambulance, 'warning'],
    [t('emergency.sirenProtocol'), t('emergency.manual'), Siren, 'neutral'],
  ];

  return (
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow={t('emergency.eyebrow')}
          title={t('emergency.title')}
          description={t('emergency.description')}
          actions={
            <Button>
              <Siren className="h-4 w-4" />
              {t('emergency.createAlert')}
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="pulse-panel p-6 lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="danger" className="border-red-300/20 bg-red-400/10 text-red-100">{t('emergency.standby')}</Badge>
                <h2 className="mt-5 font-display text-3xl font-bold text-white">{t('emergency.noIncidents')}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  {t('emergency.noIncidentsDesc')}
                </p>
              </div>
              <div className="hidden h-14 w-14 items-center justify-center rounded-[12px] bg-red-500/15 text-red-200 lg:flex">
                <ShieldAlert className="h-7 w-7" />
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {responseStats.map(([label, value, Icon]) => (
                <div key={label} className="rounded-[8px] border border-white/10 bg-white/[0.055] p-4">
                  <Icon className="h-5 w-5 text-blue-300" />
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bento-card p-6">
            <h3 className="font-display text-base font-bold text-foreground">{t('emergency.criticalChannels')}</h3>
            <div className="mt-5 space-y-3">
              {channels.map(([label, status, Icon, variant]) => (
                <div key={label} className="flex items-center justify-between rounded-[8px] bg-surface-muted p-4">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon className="h-4 w-4 text-primary" /> {label}</span>
                  <Badge variant={variant}>{status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPage;
