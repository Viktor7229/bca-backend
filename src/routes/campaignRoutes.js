const express = require("express");
const router = express.Router();
const {
	getOrCreateAdvertiser,
	totalAvailableForDay,
} = require("../services/budgetService");
const {
	createCampaign,
	predictNextAvailableDay,
} = require("../services/campaignService");

router.post("/", (req, res) => {
	const { advertiser_id, campaign_name, cost } = req.body || {};
	if (
		!advertiser_id ||
		!campaign_name ||
		typeof cost !== "number" ||
		cost <= 0
	) {
		return res
			.status(400)
			.json({
				error: "advertiser_id, campaign_name, positive numeric cost required",
			});
	}
	const state = getOrCreateAdvertiser(advertiser_id);
	const { campaign, scheduled } = createCampaign(state, campaign_name, cost);
	if (scheduled) {
		return res.json({
			status: "scheduled",
			campaign_id: campaign.id,
			scheduled_for: campaign.scheduledFor,
			balance_remaining: totalAvailableForDay(state),
		});
	} else {
		return res.json({
			status: "deferred",
			campaign_id: campaign.id,
			scheduled_for: predictNextAvailableDay(state, campaign),
			reason: "insufficient_balance",
		});
	}
});

module.exports = router;
