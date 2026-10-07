# Trading Journal (MERN, TypeScript)

React + Vite + Tailwind client, Express + Mongoose API, Cloudinary screenshots. Responsive: phone (bottom tabs + drawer), tablet (icon rail), desktop (full sidebar).

```
trade-journal/
├── client/                 React app (Vite, Tailwind, React Query, Recharts)
│   └── src/
│       ├── components/     ui/ layout/ charts/ trades/ dashboard/ calendar/
│       ├── context/        Auth + active account
│       ├── hooks/          React Query hooks
│       ├── lib/            api client, formatters
│       ├── pages/          Dashboard, TradeLog, Analytics, Calendar, Accounts, Import, Auth
│       └── types/
├── server/                 Express API
│   └── src/
│       ├── config/         env (zod), db, cloudinary
│       ├── controllers/    auth, account, trade, analytics, upload, import
│       ├── middleware/     auth, validate, upload, error
│       ├── models/         User, Account, Trade
│       ├── routes/  services/  validators/  utils/
│       └── index.ts / app.ts
├── render.yaml             API deploy blueprint (Render)
└── package.json            npm workspaces
```

## Run locally
```bash
npm install
cp server/.env.example server/.env     # fill MONGODB_URI, JWT_SECRET, Cloudinary keys
npm run dev                            # API :5000, client :5173 (Vite proxies /api)
```

## Deploy
**API (Render / Railway / Fly / any Node host)**
- Root dir `server`, build `npm install --include=dev && npm run build`, start `npm start`.
- Env: `MONGODB_URI` (MongoDB Atlas), `JWT_SECRET`, `CLIENT_URL` (your client origin, comma-separate for many), `CLOUDINARY_*`.
- `render.yaml` and `server/Dockerfile` included (Docker build context = repo root: `docker build -f server/Dockerfile .`).
- Atlas: allow your host's IPs (or 0.0.0.0/0 for testing).

**Client (Vercel / Netlify / Cloudflare Pages)**
- Root dir `client`, build `npm run build`, output `dist`.
- Env: `VITE_API_URL=https://your-api.onrender.com/api`.
- SPA rewrites already in `vercel.json` and `public/_redirects`.

## Notes
- R-multiple = Net P&L ÷ risk. Risk = your override, else estimated from stop-loss distance × lots × contract size (forex 100k, XAU 100, indices 1). Estimate is rough for non-USD-quoted pairs; enter a risk amount to be exact.
- Sessions from UTC entry hour: Tokyo 00–07, London 07–12, New York 12–21, Sydney 21–24. Edit `server/src/services/trade.service.ts`.
- Import reads CSV only (auto-detects MT4/MT5-style headers, dedupes by ticket). MT HTML reports and MetaTrader auto-sync are not built.
- JWT stored in localStorage. For stricter security move to httpOnly cookies.
# trading_journal
