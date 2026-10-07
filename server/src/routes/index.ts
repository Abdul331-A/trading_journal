import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { csvUpload, imageUpload } from '../middleware/upload';
import { accountSchema, loginSchema, registerSchema, tradeQuerySchema, tradeSchema } from '../validators';
import * as auth from '../controllers/auth.controller';
import * as accounts from '../controllers/account.controller';
import * as trades from '../controllers/trade.controller';
import * as analytics from '../controllers/analytics.controller';
import * as uploads from '../controllers/upload.controller';
import { importTrades } from '../controllers/import.controller';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });

router.get('/health', (_req, res) => res.json({ ok: true }));

router.post('/auth/register', authLimiter, validate(registerSchema), auth.register);
router.post('/auth/login', authLimiter, validate(loginSchema), auth.login);

router.use(requireAuth);
router.get('/auth/me', auth.me);

router.get('/accounts', accounts.listAccounts);
router.post('/accounts', validate(accountSchema), accounts.createAccount);
router.patch('/accounts/:id', validate(accountSchema.partial()), accounts.updateAccount);
router.delete('/accounts/:id', accounts.deleteAccount);

router.get('/trades', validate(tradeQuerySchema, 'query'), trades.listTrades);
router.get('/trades/filters', trades.filterOptions);
router.get('/trades/export', trades.exportCsv);
router.post('/trades/bulk-delete', trades.bulkDelete);
router.post('/trades', validate(tradeSchema), trades.createTrade);
router.get('/trades/:id', trades.getTrade);
router.put('/trades/:id', validate(tradeSchema), trades.updateTrade);
router.delete('/trades/:id', trades.deleteTrade);

router.get('/analytics', analytics.analytics);
router.get('/analytics/calendar', analytics.calendar);
router.get('/analytics/guardrails', analytics.guardrails);

router.post('/uploads/screenshot', imageUpload.single('image'), uploads.uploadScreenshot);
router.post('/uploads/screenshot/delete', uploads.deleteScreenshot);

router.post('/imports', csvUpload.single('file'), importTrades);

export default router;
