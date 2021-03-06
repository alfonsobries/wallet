import { Selector } from "testcafe";

import { buildTranslations } from "../../../app/i18n/helpers";
import { createFixture, MNEMONICS, mockRequest } from "../../../utils/e2e-utils";
import { goToProfile } from "../../profile/e2e/common";
import { goToWallet, importWallet } from "../../wallet/e2e/common";
import { goToTransferPage } from "./common";

const translations = buildTranslations();

createFixture("Multiple Transfer action", [
	mockRequest(
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
	),
]);

test("should send multiple transfer successfully", async (t) => {
	// Navigate to profile page
	await goToProfile(t);

	// Import wallet
	await importWallet(t, MNEMONICS[0]);

	// Navigate to transfer page
	await goToTransferPage(t);

	// Select multiple button
	await t.click(Selector("span").withText(translations.TRANSACTION.MULTIPLE));

	await t.typeText(Selector("[data-testid=AddRecipient__amount]"), "10", { replace: true });

	// Add recipient #1
	await t.typeText(Selector("[data-testid=SelectDropdown__input]"), "D7JJ4ZfkJDwDCwuwzhtbCFapBUCWU3HHGP", {
		paste: true,
	});
	await t.pressKey("tab");
	await t.pressKey("enter");

	await t.click(Selector("button").withText(translations.TRANSACTION.ADD_RECIPIENT));

	// Go to step 2
	await t.expect(Selector("button").withText(translations.COMMON.CONTINUE).hasAttribute("disabled")).notOk();
	await t.click(Selector("button").withText(translations.COMMON.CONTINUE));
	await t.expect(Selector("h1").withText(translations.TRANSACTION.REVIEW_STEP.TITLE).exists).ok();
	await t.click(Selector("button").withText(translations.COMMON.CONTINUE));

	// Type mnemonic
	await t.typeText(Selector("[data-testid=AuthenticationStep__mnemonic]"), MNEMONICS[0], { replace: true });
	await t.click(Selector("[data-testid=StepNavigation__send-button"));

	// Transaction successful
	await t.expect(Selector("h1").withText(translations.TRANSACTION.SUCCESS.TITLE).exists).ok({ timeout: 5000 });
});

test("should show an error if wrong mnemonic", async (t: any) => {
	// Navigate to profile page
	await goToProfile(t);

	// Navigate to wallet page
	await goToWallet(t);

	// Navigate to transfer page
	await goToTransferPage(t);

	// Select multiple button
	await t.click(Selector("span").withText(translations.TRANSACTION.MULTIPLE));

	// Add recipient #1
	await t.typeText(Selector("[data-testid=AddRecipient__amount]"), "10", { replace: true });
	await t.typeText(Selector("[data-testid=SelectDropdown__input]"), "DReUcXWdCz2QLKzHM9NdZQE7fAwAyPwAmd", {
		paste: true,
	});
	await t.click(Selector("button").withText(translations.TRANSACTION.ADD_RECIPIENT));

	// Add recipient #2
	await t.typeText(Selector("[data-testid=SelectDropdown__input]"), "D7JJ4ZfkJDwDCwuwzhtbCFapBUCWU3HHGP", {
		paste: true,
		replace: true,
	});
	await t.typeText(Selector("[data-testid=AddRecipient__amount]"), "10", { replace: true });

	await t.click(Selector("button").withText(translations.TRANSACTION.ADD_RECIPIENT));

	// Go to step 2
	await t.click(Selector("button").withText(translations.COMMON.CONTINUE));
	await t.expect(Selector("h1").withText(translations.TRANSACTION.REVIEW_STEP.TITLE).exists).ok();
	await t.click(Selector("button").withText(translations.COMMON.CONTINUE));

	// Type wrong mnemonic
	await t.typeText(Selector("[data-testid=AuthenticationStep__mnemonic]"), "wrong mnemonic", { replace: true });
	await t.click(Selector("[data-testid=StepNavigation__send-button"));
	await t.expect(Selector("[data-testid=AuthenticationStep__mnemonic]").hasAttribute("aria-invalid")).ok();
});

test("should not clear values when returning a step", async (t: any) => {
	// Navigate to profile page
	await goToProfile(t);

	// Navigate to wallet page
	await goToWallet(t);

	// Navigate to transfer page
	await goToTransferPage(t);

	// Select multiple button
	await t.click(Selector("span").withText(translations.TRANSACTION.MULTIPLE));

	// Add recipient #1
	await t.typeText(Selector("[data-testid=AddRecipient__amount]"), "10", { replace: true });
	await t.typeText(Selector("[data-testid=SelectDropdown__input]"), "DReUcXWdCz2QLKzHM9NdZQE7fAwAyPwAmd", {
		paste: true,
	});
	await t.click(Selector("button").withText(translations.TRANSACTION.ADD_RECIPIENT));

	// Add recipient #2
	await t.typeText(Selector("[data-testid=SelectDropdown__input]"), "D7JJ4ZfkJDwDCwuwzhtbCFapBUCWU3HHGP", {
		paste: true,
		replace: true,
	});
	await t.typeText(Selector("[data-testid=AddRecipient__amount]"), "10", { replace: true });

	await t.click(Selector("button").withText(translations.TRANSACTION.ADD_RECIPIENT));

	// Go to step 2
	await t.click(Selector("button").withText(translations.COMMON.CONTINUE));
	await t.expect(Selector("h1").withText(translations.TRANSACTION.REVIEW_STEP.TITLE).exists).ok();
	await t.click(Selector("button").withText(translations.COMMON.BACK));

	await t.expect(Selector("span").withText(translations.TRANSACTION.MULTIPLE).exists).ok();
	await t.expect(Selector("[data-testid=recipient-list__recipient-list-item]").count).eql(2);
});

test("should not able go to next step without recipient after fill single fields", async (t: any) => {
	// Navigate to profile page
	await goToProfile(t);

	// Navigate to wallet page
	await goToWallet(t);

	// Navigate to transfer page
	await goToTransferPage(t);

	// Add single recipient
	await t.typeText(Selector("[data-testid=AddRecipient__amount]"), "10", { replace: true });
	await t.typeText(Selector("[data-testid=SelectDropdown__input]"), "DReUcXWdCz2QLKzHM9NdZQE7fAwAyPwAmd", {
		paste: true,
	});

	await t.expect(Selector("button").withText(translations.COMMON.CONTINUE).hasAttribute("disabled")).notOk();

	// Select multiple button
	await t.click(Selector("span").withText(translations.TRANSACTION.MULTIPLE));

	await t.expect(Selector("button").withText(translations.COMMON.CONTINUE).hasAttribute("disabled")).ok();

	// Add recipient #1
	await t.click(Selector("button").withText(translations.TRANSACTION.ADD_RECIPIENT));

	await t.expect(Selector("button").withText(translations.COMMON.CONTINUE).hasAttribute("disabled")).notOk();
});
