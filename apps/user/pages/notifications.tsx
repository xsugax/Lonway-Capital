import Notifications from '../components/Notifications';
import Head from 'next/head';
import React from 'react';

export default function NotificationsPage({ user }: { user: { token: string; email?: string; name?: string } }) {
  return (
    <>
      <Head>
        <title>Notifications — Londway Capital</title>
        <meta name="description" content="Stay updated with your Londway Capital account notifications, alerts, and transaction updates." />
      </Head>
      <Notifications user={user} />
    </>
  );
}
