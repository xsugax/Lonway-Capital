'use client';
import React, { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';

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

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching notifications');
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [user.token]);

  return (
    <main style={{ background: '#060913', minHeight: '100vh', color: '#EAE0D0', fontFamily: 'Inter, sans-serif' }}>
      <section style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ color: '#C4A052', fontWeight: 700, fontSize: '2rem', marginBottom: '1.5rem' }}>Notifications</h1>
        {loading ? (
          <div style={{ color: '#C4A052', textAlign: 'center', marginTop: 40 }}>Loading notifications...</div>
        ) : error ? (
          <div style={{ color: '#ff4d4f', textAlign: 'center', marginTop: 40 }}>{error}</div>
        ) : notifications.length === 0 ? (
          <div style={{ color: '#60707E', fontSize: '1rem', textAlign: 'center' }}>No notifications.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notifications.map(n => (
              <li key={n.id} style={{ marginBottom: 20, background: n.read ? '#0D1628' : 'rgba(196,160,82,0.13)', borderRadius: 10, padding: '1rem', border: '1px solid rgba(196,160,82,0.1)', color: n.type === 'error' ? '#ff4d4f' : n.type === 'success' ? '#7fffd4' : '#EAE0D0', fontWeight: n.read ? 400 : 700 }}>
                <span style={{ marginRight: 12 }}>[{n.type.toUpperCase()}]</span>
                {n.message}
                <span style={{ color: '#60707E', fontWeight: 400, marginLeft: 12 }}>{new Date(n.date).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
