# BCA Backend (Simplified)

Backend service to manage advertiser budgets, campaign scheduling / deferring, rollover, and manual top-ups.

## Features
- POST /campaigns – submit campaign cost; schedules or defers
- POST /topup – minimum $10,000; increases rollover balance
- POST /simulate/day – simulates end of day rollover and moves to next day; attempts to schedule deferred campaigns
- GET /budgets/:advertiser_id – returns advertiser budget state
- GET /campaigns (or /all-campaigns) – list all campaigns and statuses
- POST /spend – optional non-campaign spend (analytics, reports, etc.)

## Business Rules
- Default daily budget: $5,000
- Unused daily budget rolls over (added to rollover_balance)
- Manual top-up minimum: $10,000 (added straight to rollover)
- If insufficient balance at submission time, campaign is deferred; re-attempted after day simulation or top-up
- Total available today = daily_budget + rollover_balance - used_today

### Scheduling & Rollover Logic
1. Each new advertiser gets a starting day (server current date) with `daily_budget = 5000`, `rollover_balance = 0`.
2. Submitting a campaign:
   - If `cost <= remaining_today` it is scheduled for `current_day` and consumes budget (`used_today += cost`).
   - Else it is marked deferred and kept in a per-advertiser First-In, First-Out queue.
3. Top-ups add to `rollover_balance` immediately; system tries to schedule deferred campaigns right away.
4. `POST /simulate/day` for each advertiser:
   - Add leftover of (daily_budget + rollover_balance - used_today) to rollover_balance (compounding) then reset `used_today`.
   - Reset daily_budget to 5000.
   - Advance `current_day` by 1.
   - Attempt to schedule any deferred campaigns using the new day's daily_budget plus rollover.
5. Non-campaign spend acts like a mini campaign (consumes from available) but is not stored in campaign list.

## Tech Stack
- Node.js (Express)
- In-memory repositories (swap with a DB layer later). Logic split into services & routes.

## Setup
```bash
npm install
npm run dev
```
Server defaults to port 3000 (override: `PORT=4001 node start.js`).

## Testing
### 1. Automated Tests (Jest + Supertest)
```bash
npm test
```
Covers: scheduling vs deferral, top-up scheduling, rollover.

### 2. Manual API Testing (PowerShell Invoke-RestMethod)
```powershell
$base = "http://localhost:3000"
# Health
Invoke-RestMethod "$base/health"
# Campaign A (scheduled)
Invoke-RestMethod -Uri "$base/campaigns" -Method Post -ContentType 'application/json' -Body '{"advertiser_id":"adv_001","campaign_name":"Campaign A","cost":3000}'
# Campaign B (deferred)
Invoke-RestMethod -Uri "$base/campaigns" -Method Post -ContentType 'application/json' -Body '{"advertiser_id":"adv_001","campaign_name":"Campaign B","cost":4000}'
# Budget
Invoke-RestMethod "$base/budgets/adv_001"
# List
Invoke-RestMethod "$base/all-campaigns"
# Top up
Invoke-RestMethod -Uri "$base/topup" -Method Post -ContentType 'application/json' -Body '{"advertiser_id":"adv_001","amount":10000}'
# Spend
Invoke-RestMethod -Uri "$base/spend" -Method Post -ContentType 'application/json' -Body '{"advertiser_id":"adv_001","amount":2000,"reason":"report"}'
# Simulate day
Invoke-RestMethod -Uri "$base/simulate/day" -Method Post
# Budget after rollover
Invoke-RestMethod "$base/budgets/adv_001"
```

### 3. Manual API Testing (curl.exe on Windows)
Use `curl.exe` (not PowerShell alias) and single quotes or escaped quotes:
```bash
curl.exe http://localhost:3000/health
curl.exe -X POST http://localhost:3000/campaigns -H "Content-Type: application/json" -d '{ "advertiser_id":"adv_001","campaign_name":"Campaign A","cost":3000 }'
```
(Repeat the other bodies analogous to the PowerShell examples.)

### 4. Scenario Walkthrough (Expected Outcomes)
1. Submit Campaign A cost 3000 -> status scheduled, balance_remaining 2000.
2. Submit Campaign B cost 4000 -> status deferred, predicted `scheduled_for` next day.
3. Top up 10000 -> Campaign B auto-schedules; remaining_today increases.
4. Spend 2000 -> remaining_today decreases accordingly.
5. Simulate day -> rollover_balance increases by leftover; day advances; used_today resets.
6. Large campaign (e.g., 16000) after rollover -> scheduled if available >= cost else deferred until enough days/top-ups.

Detailed command + expected JSON: see `TESTING_GUIDE.txt`.

### 5. Resetting State
Data is in-memory. Restart server (Ctrl+C then `npm run dev`) to clear everything.

### 6. Common Issues
- JSON parse error: quoting/escaping incorrect in shell.
- Unexpected deferral: daily budget partly consumed earlier; check `/budgets/:id`.
- Large campaign stays deferred: need more top-ups or more simulated days.

## Sample cURL (Linux/macOS style)
```bash
curl -X POST http://localhost:3000/campaigns -H 'Content-Type: application/json' -d '{"advertiser_id":"adv_001","campaign_name":"Retarget","cost":3000}'
```
(Adjust for Windows quoting if needed.)

## Notes / Improvements
- Replace in-memory maps with persistent storage (e.g., Postgres). Abstract repository interfaces.
- Add campaign completion endpoint & status transition simulation (e.g., /complete-campaign).
- Authentication / multi-tenant isolation.
- Improve prediction to account for queued campaign costs.
- Configurable per-advertiser daily budget.
- Add /admin/reset (dev) and richer test coverage (FIFO ordering, edge cases).

## License
ISC
