import { Selector } from "testcafe";

import { buildTranslations } from "../../../app/i18n/helpers";
import { BASEURL, createFixture, MNEMONICS, mockRequest } from "../../../utils/e2e-utils";
import { goToProfile } from "../../profile/e2e/common";

const translations = buildTranslations();

const prepareTest = async (t: any) => {
	await goToProfile(t);

	await t.click(Selector("button").withExactText(translations.COMMON.IMPORT));
	await t.expect(Selector("div").withText(translations.WALLETS.PAGE_IMPORT_WALLET.NETWORK_STEP.SUBTITLE).exists).ok();
};

createFixture(
	"Import Wallet action",
	[],
	[
		mockRequest(
			(request: any) => !!new RegExp(BASEURL + "wallets/([-0-9a-zA-Z]{1,34})").test(request.url),
			"coins/ark/devnet/wallets/not-found",
			404,
		),
	],
).beforeEach(async (t) => await prepareTest(t));

test("should import a wallet by mnemonic", async (t) => {
	// Select a cryptoasset and advance to second step
	await t.click('[data-testid="SelectNetworkInput__input"]');
	await t.click(Selector('[data-testid="SelectNetwork__developmentNetworks"]'));
	await t.click(Selector('[data-testid="NetworkIcon-ARK-ark.devnet"]'));
	await t
		.expect(Selector("button").withText(translations.COMMON.CONTINUE).hasAttribute("disabled"))
		.notOk("Cryptoasset selected", { timeout: 5000 });
	await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));
	await t.expect(Selector("h1").withExactText(translations.WALLETS.PAGE_IMPORT_WALLET.METHOD_STEP.TITLE).exists).ok();

	// Fill a passphrase and advance to third step
	const passphraseInput = Selector("[data-testid=ImportWallet__mnemonic-input]");

	await t.typeText(passphraseInput, "buddy year cost vendor honey tonight viable nut female alarm duck symptom");
	await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));

	await t.expect(Selector("[data-testid=EncryptPassword]").exists).ok();
	await t.click(Selector("[data-testid=ImportWallet__skip-button]"));

	await t.click(Selector("[data-testid=ImportWallet__edit-alias]"));

	const walletNameInput = Selector("input[name=name]");

	await t.click(walletNameInput).pressKey("ctrl+a delete").typeText(walletNameInput, "Wallet Alias");

	await t.click(Selector("[data-testid=UpdateWalletName__submit]"));
	await t.click(Selector("button").withExactText(translations.COMMON.GO_TO_WALLET));
});

test("should import a wallet by address", async (t) => {
	// Select a cryptoasset and advance to the step two
	await t.click('[data-testid="SelectNetworkInput__input"]');
	await t.click(Selector('[data-testid="SelectNetwork__developmentNetworks"]'));
	await t.click(Selector('[data-testid="NetworkIcon-ARK-ark.devnet"]'));
	await t
		.expect(Selector("button").withText(translations.COMMON.CONTINUE).hasAttribute("disabled"))
		.notOk("Cryptoasset selected", { timeout: 5000 });
	await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));
	await t.expect(Selector("h1").withExactText(translations.WALLETS.PAGE_IMPORT_WALLET.METHOD_STEP.TITLE).exists).ok();

	await t.click('[data-testid="SelectDropdown__input"]');
	await t.click(Selector("#ImportWallet__select-item-1"));

	// Fill an address and advance to the third step
	const addressInput = Selector("[data-testid=ImportWallet__address-input]");

	await t.typeText(addressInput, "DC8ghUdhS8w8d11K8cFQ37YsLBFhL3Dq2P");
	await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));

	// Fill a wallet name
	await t.click(Selector("[data-testid=ImportWallet__edit-alias]"));

	const walletNameInput = Selector("input[name=name]");

	await t.click(walletNameInput).pressKey("ctrl+a delete").typeText(walletNameInput, "Wallet Alias");

	await t.click(Selector("[data-testid=UpdateWalletName__submit]"));
	await t.click(Selector("button").withExactText(translations.COMMON.GO_TO_WALLET));
});

test("should show an error message for invalid address", async (t) => {
	// Select a cryptoasset and advance to step two
	await t.click('[data-testid="SelectNetworkInput__input"]');
	await t.click(Selector('[data-testid="SelectNetwork__developmentNetworks"]'));
	await t.click(Selector('[data-testid="NetworkIcon-ARK-ark.devnet"]'));
	await t
		.expect(Selector("button").withText(translations.COMMON.CONTINUE).hasAttribute("disabled"))
		.notOk("Cryptoasset selected", { timeout: 5000 });
	await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));
	await t.expect(Selector("h1").withExactText("Import Wallet").exists).ok();

	await t.click('[data-testid="SelectDropdown__input"]');
	await t.click(Selector("#ImportWallet__select-item-1"));

	// Input address
	const addressInput = Selector("[data-testid=ImportWallet__address-input]");
	await t.typeText(addressInput, "123");

	await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));

	await t.expect(Selector('[data-testid="Input__error"]').exists).ok({ timeout: 5000 });
});

test("should show an error message for duplicate address", async (t) => {
	let passphraseInput: Selector;

	// Select a cryptoasset and advance to step two
	await t.click('[data-testid="SelectNetworkInput__input"]');
	await t.click(Selector('[data-testid="SelectNetwork__developmentNetworks"]'));
	await t.click(Selector('[data-testid="NetworkIcon-ARK-ark.devnet"]'));
	await t
		.expect(Selector("button").withText(translations.COMMON.CONTINUE).hasAttribute("disabled"))
		.notOk("Cryptoasset selected", { timeout: 5000 });
	await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));
	await t.expect(Selector("h1").withExactText("Import Wallet").exists).ok();

	// Input passphrase
	passphraseInput = Selector("[data-testid=ImportWallet__mnemonic-input]");

	await t.typeText(passphraseInput, MNEMONICS[0], { paste: true, replace: true });
	await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));

	await t.expect(Selector("[data-testid=EncryptPassword]").exists).ok();
	await t.click(Selector("[data-testid=ImportWallet__skip-button]"));

	// Try to import a duplicate wallet
	await t.click(Selector("a").withExactText("Portfolio"));

	// Navigate to import page
	await t.click(Selector("button").withExactText(translations.COMMON.IMPORT));
	await t.expect(Selector("div").withText(translations.WALLETS.PAGE_IMPORT_WALLET.NETWORK_STEP.SUBTITLE).exists).ok();

	// Select a cryptoasset and advance to step two
	await t.click('[data-testid="SelectNetworkInput__input"]');
	await t.click(Selector('[data-testid="SelectNetwork__developmentNetworks"]'));
	await t.click(Selector('[data-testid="NetworkIcon-ARK-ark.devnet"]'));
	await t
		.expect(Selector("button").withText(translations.COMMON.CONTINUE).hasAttribute("disabled"))
		.notOk("Cryptoasset selected", { timeout: 5000 });
	await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));
	await t.expect(Selector("h1").withExactText("Import Wallet").exists).ok();

	// Input passphrase
	passphraseInput = Selector("[data-testid=ImportWallet__mnemonic-input]");

	await t.typeText(passphraseInput, MNEMONICS[0], { paste: true, replace: true });
	await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));

	await t.expect(Selector('[data-testid="Input__error"]').exists).ok();
});
