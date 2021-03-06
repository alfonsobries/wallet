import { createFixture, mockRequest } from "../../../utils/e2e-utils";
import { goToProfile } from "../../profile/e2e/common";
import { goToWallet, importWalletByAddress } from "../../wallet/e2e/common";
import { goToDelegateResignationPage, goToTransferPage, goToTransferPageThroughNavbar } from "./common";

createFixture("Transactions routing", [
	mockRequest("https://ark-test.payvo.com/api/wallets/DDA5nM7KEqLeTtQKv5qGgcnc6dpNBKJNTS", {
		data: {
			address: "DDA5nM7KEqLeTtQKv5qGgcnc6dpNBKJNTS",
			attributes: {
				delegate: {
					username: "testwallet",
				},
			},
			balance: "10000000000",
			isDelegate: true,
			isResigned: false,
			nonce: "1",
			publicKey: "02e012f0a7cac12a74bdc17d844cbc9f637177b470019c32a53cef94c7a56e2ea9",
		},
	}),
]);

test("should navigate to transfer page", async (t) => {
	await goToProfile(t);
	await goToWallet(t);
	await goToTransferPage(t);
});

test("should navigate to delegate resignation page", async (t) => {
	await goToProfile(t);
	await importWalletByAddress(t, "DDA5nM7KEqLeTtQKv5qGgcnc6dpNBKJNTS");
	await goToDelegateResignationPage(t);
});

test("should navigate to transfer page via navbar button", async (t) => {
	await goToProfile(t);
	await goToWallet(t);
	await goToTransferPageThroughNavbar(t);
});

test("should reload transfer page when navbar button is clicked and current route is already transfer page", async (t) => {
	await goToProfile(t);
	await goToWallet(t);
	await goToTransferPage(t);
	await goToTransferPageThroughNavbar(t);
});
