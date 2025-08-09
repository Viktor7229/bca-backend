const request = require("supertest");
const app = require("../server");

describe("Day simulation rollover", () => {
	test("rolls over unused and advances day", async () => {
		const adv = "adv_day";
		await request(app)
			.post("/campaigns")
			.send({ advertiser_id: adv, campaign_name: "A", cost: 2000 }); // leaves 3000 unused
		const before = await request(app).get(`/budgets/${adv}`);
		const day1 = before.body.current_day;
		await request(app).post("/simulate/day");
		const after = await request(app).get(`/budgets/${adv}`);
		expect(after.body.current_day).not.toBe(day1);
		// rollover_balance should at least include previous remaining (approx)
		expect(after.body.rollover_balance).toBeGreaterThanOrEqual(3000);
	});
});
