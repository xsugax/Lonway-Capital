import express from 'express';
import { getAuditLogs } from './audit.middleware';

const router = express.Router();

router.get('/logs', getAuditLogs);

export default router;
