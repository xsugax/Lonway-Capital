import TwoFASetup from '../components/TwoFASetup';
import React from 'react';

export default function TwoFAPage({ user }: { user: { token: string } }) {
  return <TwoFASetup user={user} />;
}
