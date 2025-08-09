const { DAILY_BUDGET_DEFAULT, MIN_TOPUP } = require("../domain/constants");
const { campaigns } = require("../repositories/memoryStores");
const { totalAvailableForDay } = require("./budgetService");
const { v4: uuid } = require("uuid");

function scheduleCampaign(state, campaign, day) {
	campaign.status = "scheduled";
	campaign.scheduledFor = day;
	state.usedToday += campaign.cost;
}

function deferCampaign(state, campaign, reason = "insufficient_balance") {
	campaign.status = "deferred";
	campaign.reason = reason;
	if (!state.deferredCampaignIds.includes(campaign.id))
		state.deferredCampaignIds.push(campaign.id);
}

function attemptSchedulingFactory() {
	return function attemptScheduling(state) {
		if (!state.deferredCampaignIds.length) return;
		const stillDeferred = [];
		for (const cid of state.deferredCampaignIds) {
			const camp = campaigns.get(cid);
			if (!camp || camp.status !== "deferred") continue;
			const remaining = totalAvailableForDay(state);
			if (camp.cost <= remaining) {
				scheduleCampaign(state, camp, state.currentDay);
				delete camp.reason;
			} else {
				stillDeferred.push(cid);
			}
		}
		state.deferredCampaignIds = stillDeferred;
	};
}

function predictNextAvailableDay(state, campaign) {
	let available = totalAvailableForDay(state);
	let day = new Date(state.currentDay + "T00:00:00Z");
	while (campaign.cost > available) {
		day.setUTCDate(day.getUTCDate() + 1);
		available += DAILY_BUDGET_DEFAULT;
	}
	return day.toISOString().slice(0, 10);
}

function createCampaign(advertiserState, name, cost) {
	const campaign = {
		id: uuid(),
		advertiserId: advertiserState.advertiserId,
		name,
		cost,
		status: "pending",
		scheduledFor: null,
	};
	campaigns.set(campaign.id, campaign);
	const remaining = totalAvailableForDay(advertiserState);
	if (cost <= remaining) {
		scheduleCampaign(advertiserState, campaign, advertiserState.currentDay);
		return { campaign, scheduled: true };
	} else {
		deferCampaign(advertiserState, campaign);
		return { campaign, scheduled: false };
	}
}

module.exports = {
	scheduleCampaign,
	deferCampaign,
	attemptSchedulingFactory,
	predictNextAvailableDay,
	createCampaign,
};
