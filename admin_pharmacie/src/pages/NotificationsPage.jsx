import React from 'react';
import { BellRing, CheckCheck, Mail, MessageSquareWarning, RadioTower, Send } from 'lucide-react';
import { Badge, Button, SectionHeader } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';

const NotificationsPage = () => {
  const { t } = useLanguage();
  const channels = [
    [t('notifications.inAppAlerts'), t('notifications.inAppAlertsDesc'), BellRing],
    [t('notifications.emailDigests'), t('notifications.emailDigestsDesc'), Mail],
    [t('notifications.readState'), t('notifications.readStateDesc'), CheckCheck],
  ];
  const statuses = [
    [t('notifications.criticalAlerts'), t('notifications.healthy'), BellRing],
    [t('notifications.digestSchedule'), t('notifications.daily'), Mail],
    [t('notifications.unreadPanelNoise'), t('notifications.needsTuning'), MessageSquareWarning],
    [t('notifications.broadcastService'), t('notifications.connected'), RadioTower],
  ];

  return (
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow={t('notifications.eyebrow')}
          title={t('notifications.title')}
          description={t('notifications.description')}
          actions={
            <Button>
              <Send className="h-4 w-4" />
              {t('notifications.sendTestAlert')}
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">{t('notifications.deliveryChannels')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('notifications.deliveryChannelsDesc')}</p>
              </div>
              <Badge variant="success">{t('notifications.online')}</Badge>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {channels.map(([title, body, Icon]) => (
                <div key={title} className="rounded-[12px] border border-border bg-surface-muted p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-4 font-bold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pulse-panel p-6">
            <h2 className="font-display text-xl font-bold text-white">{t('notifications.currentStatus')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('notifications.currentStatusDesc')}</p>
            <div className="mt-6 space-y-3">
              {statuses.map(([label, status, Icon], index) => (
                <div key={label} className="flex items-center justify-between rounded-[8px] border border-white/10 bg-white/[0.055] px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-200"><Icon className="h-4 w-4 text-blue-300" /> {label}</span>
                  <Badge variant={index === 2 ? 'warning' : 'success'}>{status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
