import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  timestamp: number;
  meta?: any;
  ip?: string;
  device?: string;
  status?: 'success' | 'fail';
  anomaly?: boolean;
  complianceTag?: string;
}

const auditLogs: AuditLog[] = [];

export function audit(action: string, complianceTag?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || 'anonymous';
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const device = req.headers['user-agent'] || 'unknown';
    const log: AuditLog = {
      id: crypto.randomUUID(),
      userId,
      action,
      timestamp: Date.now(),
      meta: { path: req.path, method: req.method, ...req.body },
      ip: typeof ip === 'string' ? ip : Array.isArray(ip) ? ip[0] : '',
      device,
      status: 'success',
      anomaly: false,
      complianceTag,
    };
    // Anomaly detection: flag suspicious actions
    if (action === 'login_failed' || (req.path.includes('admin') && req.method === 'DELETE')) {
      log.anomaly = true;
      log.status = 'fail';
    }
    auditLogs.push(log);
    next();
  };
}

export function getAuditLogs(req: Request, res: Response) {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  const { userId, anomaly, complianceTag } = req.query;
  let logs = auditLogs;
  if (userId) logs = logs.filter(l => l.userId === userId);
  if (anomaly === 'true') logs = logs.filter(l => l.anomaly);
  if (complianceTag) logs = logs.filter(l => l.complianceTag === complianceTag);
  res.json({ logs });
}

export function getAuditLogById(req: Request, res: Response) {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  const { id } = req.params;
  const log = auditLogs.find(l => l.id === id);
  if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
  res.json({ log });
}

export function deleteAuditLog(req: Request, res: Response) {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  const { id } = req.params;
  const idx = auditLogs.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Log not found' });
  auditLogs.splice(idx, 1);
  res.json({ success: true });
}

export function complianceReport(req: Request, res: Response) {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  const complianceSummary = auditLogs.reduce((acc, log) => {
    if (log.complianceTag) {
      acc[log.complianceTag] = (acc[log.complianceTag] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  res.json({ complianceSummary });
}

// ... (extend with export, advanced anomaly detection, SIEM integration, retention policies, etc.)
