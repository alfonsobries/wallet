import { Selector } from "testcafe";

import { buildTranslations } from "../../../app/i18n/helpers";
import { createFixture, mockMuSigRequest, mockRequest } from "../../../utils/e2e-utils";
import { goToProfile } from "../../profile/e2e/common";
import { importWalletByAddress } from "../../wallet/e2e/common";

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

createFixture("Multisignature Votes", [
	transactionMock,
	walletMock,
	mockMuSigRequest("https://ark-test-musig.payvo.com", "store", {
		result: {
			id: "transaction-id",
		},
	}),
]);

test("should successfully send a vote transaction with a multisig wallet", async (t) => {
	// Navigate to profile page
	await goToProfile(t);

	// Import wallet
	await importWalletByAddress(t, "DJXg9Vqg2tofRNrMAvMzhZTkegu8QyyNQq");

	// Navigate to vote page
	await t.click(Selector('[data-testid="navbar__useractions"]'));
	await t.expect(Selector('[data-testid="dropdown__option--1"]').withText(translations.COMMON.VOTES).exists).ok();
	await t.click(Selector('[data-testid="dropdown__option--1"]').withText(translations.COMMON.VOTES));
	await t.expect(Selector("h1").withText(translations.VOTE.VOTES_PAGE.TITLE).exists).ok();

	// Select address
	await t.click(Selector('[data-testid="AddressRow__select-2"]').withText(translations.COMMON.VOTE));

	// Select delegate
	await t.expect(Selector("h2").withText(translations.VOTE.DELEGATE_TABLE.TITLE).exists).ok();
	await t.click(Selector('[data-testid="DelegateRow__toggle-1"]').withText(translations.COMMON.SELECT));
	await t.expect(Selector("[data-testid=DelegateTable__footer]").exists).ok();
	await t.click(Selector('[data-testid="DelegateTable__continue-button"]').withText(translations.COMMON.CONTINUE));

	// Vote Transaction
	await t.expect(Selector("h1").withText(translations.TRANSACTION.PAGE_VOTE.FORM_STEP.TITLE).exists).ok();
	await t.click(Selector("button").withText(translations.COMMON.CONTINUE));

	// Transaction Review
	await t.click(Selector("button").withText(translations.COMMON.CONTINUE));

	// Transaction successful
	await t.expect(Selector("h1").withText(translations.TRANSACTION.SUCCESS.TITLE).exists).ok({ timeout: 60_000 });
});
