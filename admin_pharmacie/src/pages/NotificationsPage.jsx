import React from 'react';
import { BellRing, CheckCheck, Mail } from 'lucide-react';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeader } from '../components/ui';

const NotificationsPage = () => (
  <div className="page-shell">
    <div className="page-content">
      <SectionHeader
        eyebrow="Messaging"
        title="Notification center"
        description="A more polished overview for alert delivery, digest behavior, and unread operational signals."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Delivery channels</CardTitle>
              <CardDescription>Core outbound paths used by the admin experience.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-surface-muted p-5">
              <BellRing className="h-5 w-5 text-primary" />
              <p className="mt-4 font-medium text-foreground">In-app alerts</p>
              <p className="mt-1 text-sm text-muted-foreground">Operational notices and system prompts.</p>
            </div>
            <div className="rounded-2xl bg-surface-muted p-5">
              <Mail className="h-5 w-5 text-primary" />
              <p className="mt-4 font-medium text-foreground">Email digests</p>
              <p className="mt-1 text-sm text-muted-foreground">Scheduled delivery for lower-priority activity.</p>
            </div>
            <div className="rounded-2xl bg-surface-muted p-5">
              <CheckCheck className="h-5 w-5 text-success" />
              <p className="mt-4 font-medium text-foreground">Read state</p>
              <p className="mt-1 text-sm text-muted-foreground">Improved hierarchy and muted surfaces.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current status</CardTitle>
            <CardDescription>Presentation-only summary for the redesigned center.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-surface-muted px-4 py-3">
              <span className="text-sm text-foreground">Critical alerts</span>
              <Badge variant="success">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-surface-muted px-4 py-3">
              <span className="text-sm text-foreground">Digest schedule</span>
              <Badge variant="primary">Daily</Badge>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-surface-muted px-4 py-3">
              <span className="text-sm text-foreground">Unread panel noise</span>
              <Badge variant="warning">Needs tuning</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default NotificationsPage;
