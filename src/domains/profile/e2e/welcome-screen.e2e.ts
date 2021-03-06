import { Selector } from "testcafe";

import { buildTranslations } from "../../../app/i18n/helpers";
import { createFixture } from "../../../utils/e2e-utils";
import { goToSettings } from "../../setting/e2e/common";

const translations = buildTranslations();

createFixture("Welcome Screen routing");

test("should load profiles welcome page", async (t) => {
	await t.expect(Selector("span").withText(translations.COMMON.PAYVO_WALLET).exists).ok();
});

test("should return to welcome page when application is idle", async (t) => {
	await goToSettings(t);

	await t.click(Selector("[data-testid=Input__suggestion]").withText("15 minutes"));
	await t.click('[data-testid="SelectDropdown__option--0"]');

	await t.click(Selector("button").withText(translations.COMMON.SAVE));

	await t.expect(Selector("[data-testid=Input__suggestion]").withText("1 minute").exists).notOk({ timeout: 100_000 });
});
