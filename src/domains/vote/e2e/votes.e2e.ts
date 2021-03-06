import { Selector } from "testcafe";

import { buildTranslations } from "../../../app/i18n/helpers";
import { createFixture, mockMuSigRequest, mockRequest } from "../../../utils/e2e-utils";
import { goToProfile } from "../../profile/e2e/common";
import { goToWallet } from "../../wallet/e2e/common";

const translations = buildTranslations();

const transactionMock = mockRequest(
	{
		method: "POST",
		url: "https://ark-test.payvo.com/api/transactions",
	},
	{
		data: {
			accept: ["transaction-id"],
			broadcast: ["transaction-id"],
			excess: [],
			invalid: [],
		},
	},
);

const walletMock = mockRequest(
	{
		method: "POST",
		url: "https://ark-test.payvo.com/api/wallets/D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD",
	},
	{
		data: {
			address: "D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD",
			attributes: {
				htlc: {
					lockedBalance: "0",
					locks: {},
				},
			},
			balance: "3375089801",
			isDelegate: false,
			isResigned: false,
			lockedBalance: "0",
			multiSignature: {},
			nonce: "245",
			publicKey: "03df6cd794a7d404db4f1b25816d8976d0e72c5177d17ac9b19a92703b62cdbbbc",
		},
	},
);

createFixture("Votes", [
	transactionMock,
	walletMock,
	mockMuSigRequest("https://ark-test-musig.payvo.com", "store", {
		result: {
			id: "transaction-id",
		},
	}),
]);

test("should navigate to votes page from navigation bar", async (t) => {
	await goToProfile(t);
	await goToWallet(t);

	// Navigate to vote page
	await t.click(Selector('[data-testid="navbar__useractions"]'));
	await t.expect(Selector('[data-testid="dropdown__option--1"]').withText(translations.COMMON.VOTES).exists).ok();
	await t.click(Selector('[data-testid="dropdown__option--1"]').withText(translations.COMMON.VOTES));
	await t.expect(Selector("h1").withText(translations.VOTE.VOTES_PAGE.TITLE).exists).ok();
});
