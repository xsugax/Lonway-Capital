import AuditLogs from '../components/AuditLogs';
import React from 'react';

export default function AuditLogsPage({ user }: { user: { token: string } }) {
  return <AuditLogs user={user} />;
}
