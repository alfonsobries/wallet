import { Contracts } from "@payvo/profiles";
import nock from "nock";
import React from "react";
import { env, getDefaultProfileId, render, syncDelegates, waitFor } from "testing-library";

import { AddressTable } from "./AddressTable";

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;

describe("AddressTable", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		await env.profiles().restore(profile);
		await profile.sync();

		wallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");

		nock.disableNetConnect();

		nock("https://ark-test.payvo.com")
			.get("/api/delegates")
			.query({ page: "1" })
			.reply(200, require("tests/fixtures/coins/ark/devnet/delegates.json"))
			.persist();

		await syncDelegates(profile);
		await wallet.synchroniser().votes();
	});

	it("should render", async () => {
		const { asFragment, container, getByTestId } = render(<AddressTable wallets={[wallet]} />);

		expect(container).toBeTruthy();

		await waitFor(() => expect(getByTestId("AddressRow__status")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render when the maximum votes is greater than 1", () => {
		const maxVotesMock = jest.spyOn(wallet.network(), "maximumVotesPerWallet").mockReturnValue(10);
		const { asFragment, container } = render(<AddressTable wallets={[wallet]} />);

		expect(container).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();

		maxVotesMock.mockRestore();
	});
});
