'use client';
import React, { useEffect, useState } from 'react';
import { getNotifications as loadNotifications } from '../lib/store';

interface Notification {
  id: string;
  message: string;
  type: string;
  date: string;
  read: boolean;
}

export default function Notifications({ user }: { user: { token: string } }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = require('../contexts/ThemeContext').useTheme();

  useEffect(() => {
    setNotifications(loadNotifications());
    setLoading(false);
  }, []);

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: 'Inter, sans-serif' }}>
      <section style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ color: colors.gold, fontWeight: 700, fontSize: '2rem', marginBottom: '1.5rem' }}>Notifications</h1>
        {loading ? (
          <div style={{ color: colors.gold, textAlign: 'center', marginTop: 40 }}>Loading notifications...</div>
        ) : error ? (
          <div style={{ color: colors.danger, textAlign: 'center', marginTop: 40 }}>{error}</div>
        ) : notifications.length === 0 ? (
          <div style={{ color: colors.textFaint, fontSize: '1rem', textAlign: 'center' }}>No notifications.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notifications.map(n => (
              <li key={n.id} style={{ marginBottom: 20, background: n.read ? colors.surface : colors.goldBg, borderRadius: 10, padding: '1rem', border: `1px solid ${colors.border}`, color: n.type === 'error' ? colors.danger : n.type === 'success' ? colors.success : colors.text, fontWeight: n.read ? 400 : 700 }}>
                <span style={{ marginRight: 12 }}>[{n.type.toUpperCase()}]</span>
                {n.message}
                <span style={{ color: colors.textFaint, fontWeight: 400, marginLeft: 12 }}>{new Date(n.date).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
