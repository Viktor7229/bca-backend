const request = require("supertest");
const app = require("../server");

describe("Campaign scheduling & deferral", () => {
	test("schedules campaign within daily budget and defers exceeding one", async () => {
		const res1 = await request(app)
			.post("/campaigns")
			.send({ advertiser_id: "adv_test", campaign_name: "A", cost: 3000 });
		expect(res1.body.status).toBe("scheduled");
		const res2 = await request(app)
			.post("/campaigns")
			.send({ advertiser_id: "adv_test", campaign_name: "B", cost: 4000 });
		expect(res2.body.status).toBe("deferred");
	});
});

describe("Topup triggers scheduling", () => {
	test("deferred campaign schedules after topup", async () => {
		const adv = "adv_topup";
		await request(app)
			.post("/campaigns")
			.send({ advertiser_id: adv, campaign_name: "Big", cost: 6000 }); // deferred (over 5000)
		const list1 = await request(app).get("/all-campaigns");
		expect(Array.isArray(list1.body)).toBe(true);
		const deferred = list1.body.find(
			(c) => c.advertiser_id === adv && c.name === "Big",
		);
		expect(deferred.status).toBe("deferred");
		await request(app)
			.post("/topup")
			.send({ advertiser_id: adv, amount: 10000 });
		const list2 = await request(app).get("/all-campaigns");
		const scheduled = list2.body.find(
			(c) => c.advertiser_id === adv && c.name === "Big",
		);
		expect(scheduled.status).toBe("scheduled");
	});
});
