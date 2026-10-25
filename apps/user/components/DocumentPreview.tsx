'use client';
import React, { useEffect, useState } from 'react';
import { DOCUMENT_EVENT, downloadHtmlFile, type DocumentDetail } from '../lib/presentDocument';

export default function DocumentPreview() {
  const [doc, setDoc] = useState<DocumentDetail | null>(null);

  useEffect(() => {
    const onDoc = (event: Event) => {
      const detail = (event as CustomEvent<DocumentDetail>).detail;
      if (detail?.html) setDoc(detail);
    };
    window.addEventListener(DOCUMENT_EVENT, onDoc);
    return () => window.removeEventListener(DOCUMENT_EVENT, onDoc);
  }, []);

  if (!doc) return null;

  const printDoc = () => {
    const frame = document.getElementById('londway-doc-frame') as HTMLIFrameElement | null;
    frame?.contentWindow?.focus();
    frame?.contentWindow?.print();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200000, background: 'rgba(26,21,5,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: 'min(920px, 100%)', height: 'min(100%, 960px)', background: '#fff', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(20,16,8,0.28)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', background: '#0D1628', color: '#fff' }}>
          <strong style={{ fontSize: '0.95rem' }}>{doc.title}</strong>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button type="button" onClick={printDoc} style={actionBtn}>Save PDF</button>
            <button type="button" onClick={() => downloadHtmlFile(doc.html, doc.filename)} style={{ ...actionBtn, background: 'transparent', color: '#fff' }}>Download</button>
            <button type="button" onClick={() => setDoc(null)} style={{ ...actionBtn, background: 'transparent', color: '#fff' }}>Close</button>
          </div>
        </div>
        <iframe id="londway-doc-frame" title={doc.title} srcDoc={doc.html} style={{ flex: 1, width: '100%', border: 0, background: '#fff' }} />
      </div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  background: '#C4A052',
  color: '#1A1505',
  border: '1px solid #C4A052',
  borderRadius: 8,
  padding: '8px 14px',
  fontWeight: 700,
  fontSize: '0.88rem',
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
};
