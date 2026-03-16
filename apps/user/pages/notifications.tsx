import Notifications from '../components/Notifications';
import React from 'react';

export default function NotificationsPage({ user }: { user: { token: string } }) {
  return <Notifications user={user} />;
}
