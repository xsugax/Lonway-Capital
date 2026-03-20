'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getNotifications as loadNotifications, saveNotifications } from '../lib/store';

interface Notification {
  id: string;
  message: string;
  type: string;
  date: string;
  read: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const TYPE_ICON: Record<string, string> = {
  success: '✅', error: '❌', warning: '⚠️', info: '🔔',
};

export default function Notifications({ user }: { user: { token: string; email?: string } }) {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setNotifications(loadNotifications(user?.email));
  }, [user?.email]);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, [refresh]);

  const persist = (updated: Notification[]) => {
    saveNotifications(updated, user?.email);
    setNotifications(updated);
  };

  const markRead = (id: string) => {
    persist(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    persist(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteOne = (id: string) => {
    persist(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    persist([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: 'Inter, sans-serif' }}>
      <section style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ color: colors.gold, fontWeight: 700, fontSize: '1.8rem', margin: 0 }}>Notifications</h1>
            {unreadCount > 0 && (
              <span style={{ fontSize: '0.78rem', color: colors.textMuted }}>{unreadCount} unread</span>
            )}
          </div>
          {notifications.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{
                  background: colors.goldBg, border: `1px solid ${colors.gold}`, color: colors.gold,
                  borderRadius: 8, padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                }}>Mark All Read</button>
              )}
              <button onClick={clearAll} style={{
                background: 'rgba(255,77,79,0.08)', border: '1px solid rgba(255,77,79,0.3)', color: '#ff4d4f',
                borderRadius: 8, padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              }}>Clear All</button>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ color: colors.gold, textAlign: 'center', marginTop: 40 }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔔</div>
            <div style={{ color: colors.textMuted, fontSize: '0.95rem' }}>No notifications yet</div>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notifications.map(n => (
              <li key={n.id} style={{
                marginBottom: 10,
                background: n.read ? colors.surface : colors.goldBg,
                borderRadius: 12,
                padding: '0.85rem 1rem',
                border: `1px solid ${n.read ? colors.border : colors.gold + '44'}`,
                display: 'flex', alignItems: 'flex-start', gap: 10,
                transition: 'background 0.2s',
              }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 2 }}>
                  {TYPE_ICON[n.type] || '🔔'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.85rem', lineHeight: 1.45,
                    color: colors.text, fontWeight: n.read ? 400 : 600,
                  }}>{n.message}</div>
                  <div style={{ fontSize: '0.7rem', color: colors.textMuted, marginTop: 4 }}>
                    {timeAgo(n.date)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} title="Mark as read" style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: colors.gold,
                      fontSize: '0.9rem', padding: '2px 5px', borderRadius: 6,
                    }}>✓</button>
                  )}
                  <button onClick={() => deleteOne(n.id)} title="Delete" style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted,
                    fontSize: '0.85rem', padding: '2px 5px', borderRadius: 6,
                  }}>✕</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
