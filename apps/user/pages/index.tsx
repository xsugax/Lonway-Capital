import Dashboard from '../src/Dashboard';

export default function Home({ user }: { user: { token: string } }) {
  return <Dashboard user={user} />;
}
