import express from 'express';
import { setup2FA, enable2FA, verify2FA } from './twofa.controller';

const router = express.Router();

router.post('/setup', setup2FA);
router.post('/enable', enable2FA);
router.post('/verify', verify2FA);

export default router;
