import TwoFASetup from '../components/TwoFASetup';
import Head from 'next/head';
import React from 'react';

export default function TwoFAPage({ user }: { user: { token: string } }) {
  return (
    <>
      <Head>
        <title>Two-Factor Authentication — Londway Capital</title>
        <meta name="description" content="Set up two-factor authentication for enhanced security on your Londway Capital account." />
      </Head>
      <TwoFASetup user={user} />
    </>
  );
}
