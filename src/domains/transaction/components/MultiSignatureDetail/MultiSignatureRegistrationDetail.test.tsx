import { Contracts } from "@payvo/profiles";
import React from "react";
import { TransactionFixture } from "tests/fixtures/transactions";
import { env, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";

import { translations } from "../../i18n";
import { MultiSignatureRegistrationDetail } from "./MultiSignatureRegistrationDetail";

describe("MultiSignatureRegistrationDetail", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();

		await env.profiles().restore(profile);
		await profile.sync();
	});

	it("should render", async () => {
		const { container } = render(
			<MultiSignatureRegistrationDetail
				transaction={{
					...TransactionFixture,
					min: () => 2,
					publicKeys: () => [wallet.publicKey()!, profile.wallets().last().publicKey()],
					wallet: () => wallet,
				}}
				isOpen
			/>,
		);

		await waitFor(() =>
			expect(screen.getByText(translations.MODAL_MULTISIGNATURE_DETAIL.STEP_1.TITLE)).toBeInTheDocument(),
		);

		expect(container).toMatchSnapshot();
	});
});
