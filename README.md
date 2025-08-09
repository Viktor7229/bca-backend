# BCA Backend (Simplified)

Backend service to manage advertiser budgets, campaign scheduling / deferring, rollover, and manual top-ups.

## Features
- POST /campaigns – submit campaign cost; schedules or defers
- POST /topup – minimum $10,000; increases rollover balance
- POST /simulate-day – simulates end of day rollover and moves to next day; attempts to schedule deferred campaigns
- GET /budgets/:advertiser_id – returns advertiser budget state
- GET /campaigns – list all campaigns and statuses
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
   - Else it is marked deferred and kept in a per-advertiser FIFO queue.
3. Top-ups add to `rollover_balance` immediately; system tries to schedule deferred campaigns right away.
4. `POST /simulate-day` for each advertiser:
   - Add leftover of (daily_budget + rollover_balance - used_today) to rollover_balance (effectively compounding) then reset `used_today`.
   - Reset daily_budget to 5000.
   - Advance `current_day` by 1.
   - Attempt to schedule any deferred campaigns using the new day's daily_budget plus rollover.
5. Non-campaign spend acts like a mini campaign (consumes from available) but is not stored in campaign list.

## Tech Stack
- Node.js (Express)
- In-memory repositories (swap with a DB layer later). Business logic kept in server for brevity; refactor into services for production.

## Setup
```bash
npm install
npm run dev
```
Server defaults to port 3000.

## Sample cURL
Submit campaign:
```bash
curl -X POST http://localhost:3000/campaigns -H "Content-Type: application/json" -d '{"advertiser_id":"adv_001","campaign_name":"Retarget","cost":3000}'
```
Top up:
```bash
curl -X POST http://localhost:3000/topup -H "Content-Type: application/json" -d '{"advertiser_id":"adv_001","amount":10000}'
```
Simulate day:
```bash
curl -X POST http://localhost:3000/simulate-day
```
Budget state:
```bash
curl http://localhost:3000/budgets/adv_001
```
List campaigns:
```bash
curl http://localhost:3000/campaigns
```
Other spend:
```bash
curl -X POST http://localhost:3000/spend -H "Content-Type: application/json" -d '{"advertiser_id":"adv_001","amount":1500,"reason":"report"}'
```

## Notes / Improvements
- Replace in-memory maps with persistent storage (e.g., Postgres). Abstract repository interfaces.
- Add unit tests for budget rollover, deferral ordering, and top-up scheduling.
- Add campaign completion endpoint & status transition simulation (e.g., /complete-campaign).
- Add authentication / multi-tenant isolation.
- Refine predictNextAvailableDay to simulate consumption across queued campaigns.
- Support configurable per-advertiser daily budget.

## License
ISC
