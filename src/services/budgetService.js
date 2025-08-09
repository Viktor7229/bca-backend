const { DAILY_BUDGET_DEFAULT } = require("../domain/constants");
const { advertisers } = require("../repositories/memoryStores");

function getOrCreateAdvertiser(advertiserId) {
	if (!advertisers.has(advertiserId)) {
		advertisers.set(advertiserId, {
			advertiserId,
			currentDay: new Date().toISOString().slice(0, 10),
			rolloverBalance: 0,
			dailyBudget: DAILY_BUDGET_DEFAULT,
			usedToday: 0,
			deferredCampaignIds: [],
		});
	}
	return advertisers.get(advertiserId);
}

function totalAvailableForDay(state) {
	return state.dailyBudget + state.rolloverBalance - state.usedToday;
}

function endOfDayRollover(state) {
	const remaining = totalAvailableForDay(state);
	if (remaining > 0) state.rolloverBalance += remaining;
	state.usedToday = 0;
	state.dailyBudget = DAILY_BUDGET_DEFAULT;
}

function advanceDay(state, attemptScheduling) {
	const nextDate = new Date(state.currentDay + "T00:00:00Z");
	nextDate.setUTCDate(nextDate.getUTCDate() + 1);
	state.currentDay = nextDate.toISOString().slice(0, 10);
	attemptScheduling(state);
}

module.exports = {
	getOrCreateAdvertiser,
	totalAvailableForDay,
	endOfDayRollover,
	advanceDay,
};
