import Dashboard from '../src/Dashboard';
import Head from 'next/head';

export default function Home({ user }: { user: { token: string } }) {
  return (
    <>
      <Head>
        <title>Dashboard — Londway Capital | Private Banking</title>
        <meta name="description" content="Londway Capital dashboard — view your accounts, track balances, and manage your private banking portfolio in real time." />
      </Head>
      <Dashboard user={user} />
    </>
  );
}
