import React from 'react';
import { Globe2, Languages, MessageSquareText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeader } from '../components/ui';

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
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('languages.supportedTitle')}</CardTitle>
              <CardDescription>{t('languages.supportedDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('languages.readinessTitle')}</CardTitle>
              <CardDescription>{t('languages.readinessDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-3xl bg-surface-muted p-6">
                <Languages className="h-6 w-6 text-primary" />
                <p className="mt-4 font-display text-xl font-semibold text-foreground">{t('languages.readinessHeading')}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t('languages.readinessBody')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('languages.workflowTitle')}</CardTitle>
              <CardDescription>{t('languages.workflowDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 rounded-2xl bg-surface-muted p-4"><Globe2 className="h-4 w-4 text-primary" /> {t('languages.storage')}</div>
              <div className="flex items-center gap-3 rounded-2xl bg-surface-muted p-4"><MessageSquareText className="h-4 w-4 text-primary" /> {t('languages.document')}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LanguagesPage;
