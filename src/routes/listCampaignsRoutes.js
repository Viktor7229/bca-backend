const express = require("express");
const router = express.Router();
const { campaigns } = require("../repositories/memoryStores");

router.get("/", (req, res) => {
	const list = Array.from(campaigns.values()).map((c) => ({
		id: c.id,
		advertiser_id: c.advertiserId,
		name: c.name,
		cost: c.cost,
		status: c.status,
		scheduled_for: c.scheduledFor || null,
		reason: c.reason || undefined,
	}));
	res.json(list);
});

module.exports = router;
