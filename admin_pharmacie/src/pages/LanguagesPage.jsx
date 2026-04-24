import React from 'react';
import { CheckCircle2, Globe2, Languages, MessageSquareText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Badge, Button, SectionHeader } from '../components/ui';

const LanguagesPage = () => {
  const { language, setLanguage, languages, t } = useLanguage();

  return (
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow={t('languages.eyebrow')}
          title={t('languages.title')}
          description={t('languages.description')}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="bento-card p-6">
            <h2 className="font-display text-base font-bold text-foreground">{t('languages.supportedTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('languages.supportedDesc')}</p>
            <div className="mt-6 grid gap-3">
              {languages.map((item) => (
                <Button
                  key={item.code}
                  variant={language === item.code ? 'primary' : 'secondary'}
                  className="justify-between"
                  onClick={() => setLanguage(item.code)}
                >
                  <span>{item.label}</span>
                  {language === item.code ? <Badge variant="success">{t('common.active')}</Badge> : null}
                </Button>
              ))}
            </div>
          </div>

          <div className="pulse-panel p-6">
            <Languages className="h-7 w-7 text-blue-300" />
            <h2 className="mt-5 font-display text-xl font-bold text-white">{t('languages.readinessHeading')}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{t('languages.readinessBody')}</p>
            <div className="mt-6 rounded-[8px] border border-white/10 bg-white/[0.055] p-4">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-500">{t('languages.activeLocale')}</p>
              <p className="mt-1 text-lg font-bold text-white">{language.toUpperCase()}</p>
            </div>
          </div>

          <div className="bento-card p-6">
            <h2 className="font-display text-base font-bold text-foreground">{t('languages.workflowTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('languages.workflowDesc')}</p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 rounded-[8px] bg-surface-muted p-4 text-sm font-medium text-foreground">
                <Globe2 className="h-4 w-4 text-primary" />
                {t('languages.storage')}
              </div>
              <div className="flex items-center gap-3 rounded-[8px] bg-surface-muted p-4 text-sm font-medium text-foreground">
                <MessageSquareText className="h-4 w-4 text-primary" />
                {t('languages.document')}
              </div>
              <div className="flex items-center gap-3 rounded-[8px] bg-surface-muted p-4 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                {t('languages.runtimeSwitch')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguagesPage;
