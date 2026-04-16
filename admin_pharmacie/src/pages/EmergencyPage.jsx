import React from 'react';
import { Ambulance, ShieldAlert, Siren } from 'lucide-react';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeader } from '../components/ui';

const EmergencyPage = () => (
  <div className="page-shell">
    <div className="page-content">
      <SectionHeader
        eyebrow="Emergency"
        title="Emergency coordination"
        description="A cleaner surface for incident response, critical communications, and escalation ownership."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Response status</CardTitle>
            <CardDescription>Current readiness posture.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-3xl bg-danger-soft p-6">
              <ShieldAlert className="h-6 w-6 text-danger" />
              <p className="mt-4 font-display text-xl font-semibold text-foreground">Standby</p>
              <p className="mt-2 text-sm text-muted-foreground">No active incidents detected in the current admin interface.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Escalation chain</CardTitle>
            <CardDescription>Visible stakeholders for urgent events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl bg-surface-muted p-4 text-sm text-foreground">Operations lead</div>
            <div className="rounded-2xl bg-surface-muted p-4 text-sm text-foreground">Regional support</div>
            <div className="rounded-2xl bg-surface-muted p-4 text-sm text-foreground">Emergency hotline owner</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Critical channels</CardTitle>
            <CardDescription>Primary alert surfaces.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="danger"><Siren className="h-3.5 w-3.5" /> Immediate alerts</Badge>
            <Badge variant="warning"><Ambulance className="h-3.5 w-3.5" /> Coordination updates</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default EmergencyPage;
