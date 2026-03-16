import React, { useEffect, useState } from 'react';

interface AuditLog {
  userId: string;
  action: string;
  timestamp: number;
  meta?: any;
}

export default function AuditLogs({ user }: { user: { token: string } }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${API_URL}/security/audit/logs`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch logs');
        setLogs(data.logs || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching logs');
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [user.token]);

  return (
    <main style={{ background: '#060913', minHeight: '100vh', color: '#EAE0D0', fontFamily: 'Inter, sans-serif' }}>
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ color: '#C4A052', fontWeight: 700, fontSize: '2rem', marginBottom: '1.5rem' }}>Audit Logs</h1>
        {loading ? (
          <div style={{ color: '#C4A052', textAlign: 'center', marginTop: 40 }}>Loading logs...</div>
        ) : error ? (
          <div style={{ color: '#ff4d4f', textAlign: 'center', marginTop: 40 }}>{error}</div>
        ) : logs.length === 0 ? (
          <div style={{ color: '#60707E', fontSize: '1rem', textAlign: 'center' }}>No logs found.</div>
        ) : (
          <table style={{ width: '100%', color: '#EAE0D0', background: 'transparent', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ color: '#C4A052', fontWeight: 700, fontSize: '1.1rem' }}>
                <th style={{ padding: 8, borderBottom: '1px solid rgba(196,160,82,0.13)' }}>User ID</th>
                <th style={{ padding: 8, borderBottom: '1px solid rgba(196,160,82,0.13)' }}>Action</th>
                <th style={{ padding: 8, borderBottom: '1px solid rgba(196,160,82,0.13)' }}>Timestamp</th>
                <th style={{ padding: 8, borderBottom: '1px solid rgba(196,160,82,0.13)' }}>Meta</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(196,160,82,0.07)' }}>
                  <td style={{ padding: 8 }}>{log.userId}</td>
                  <td style={{ padding: 8 }}>{log.action}</td>
                  <td style={{ padding: 8 }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>{log.meta ? JSON.stringify(log.meta) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
