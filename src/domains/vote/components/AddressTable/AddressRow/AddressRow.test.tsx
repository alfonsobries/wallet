/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/profiles";
// @README: This import is fine in tests but should be avoided in production code.
import { ReadOnlyWallet } from "@payvo/profiles/distribution/read-only-wallet";
import nock from "nock";
import React from "react";
import { act, env, fireEvent, getDefaultProfileId, render, syncDelegates, waitFor } from "testing-library";
import { data } from "tests/fixtures/coins/ark/devnet/delegates.json";
import walletMock from "tests/fixtures/coins/ark/devnet/wallets/D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD.json";
import { MNEMONICS } from "utils/testing-library";

import { AddressRow } from "./AddressRow";

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;
let blankWallet: Contracts.IReadWriteWallet;
let unvotedWallet: Contracts.IReadWriteWallet;

let emptyProfile: Contracts.IProfile;
let wallet2: Contracts.IReadWriteWallet;

const blankWalletPassphrase = "power return attend drink piece found tragic fire liar page disease combine";

describe("AddressRow", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		wallet.data().set(Contracts.WalletFlag.Starred, true);
		wallet.data().set(Contracts.WalletData.DerivationPath, "0");

		blankWallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: blankWalletPassphrase,
			network: "ark.devnet",
		});
		profile.wallets().push(blankWallet);

		unvotedWallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[0],
			network: "ark.devnet",
		});
		profile.wallets().push(unvotedWallet);

		emptyProfile = env.profiles().findById("cba050f1-880f-45f0-9af9-cfe48f406052");

		wallet2 = await emptyProfile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[1],
			network: "ark.devnet",
		});
		profile.wallets().push(wallet2);

		nock.disableNetConnect();

		nock("https://ark-test.payvo.com")
			.get("/api/delegates")
			.query({ page: "1" })
			.reply(200, require("tests/fixtures/coins/ark/devnet/delegates.json"))
			.get(`/api/wallets/${unvotedWallet.address()}`)
			.reply(200, walletMock)
			.get(`/api/wallets/${blankWallet.address()}`)
			.reply(404, {
				error: "Not Found",
				message: "Wallet not found",
				statusCode: 404,
			})
			.get(`/api/wallets/${wallet2.address()}`)
			.reply(404, {
				error: "Not Found",
				message: "Wallet not found",
				statusCode: 404,
			})
			.persist();

		await syncDelegates(profile);
		await wallet.synchroniser().votes();
		await wallet.synchroniser().identity();
		await wallet.synchroniser().coin();
	});

	it("should render", async () => {
		const { asFragment, container, getByTestId } = render(
			<table>
				<tbody>
					<AddressRow index={0} maxVotes={1} wallet={wallet} />
				</tbody>
			</table>,
		);

		expect(container).toBeTruthy();

		await waitFor(() => expect(getByTestId("AddressRow__status")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render when the maximum votes is greater than 1", () => {
		const votesMock = jest.spyOn(wallet.voting(), "current").mockReturnValue(
			[0, 1, 2, 3].map((index) => ({
				amount: 0,
				wallet: new ReadOnlyWallet({
					address: data[index].address,
					explorerLink: "",
					publicKey: data[index].publicKey,
					rank: data[index].rank,
					username: data[index].username,
				}),
			})),
		);

		const { asFragment, container } = render(
			<table>
				<tbody>
					<AddressRow index={0} maxVotes={10} wallet={wallet} />
				</tbody>
			</table>,
		);

		expect(container).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();

		votesMock.mockRestore();
	});

	it("should render when the wallet has many votes", () => {
		const votesMock = jest.spyOn(wallet.voting(), "current").mockReturnValue(
			[0, 1, 2, 3, 4].map((index) => ({
				amount: 0,
				wallet: new ReadOnlyWallet({
					address: data[index].address,
					explorerLink: "",
					publicKey: data[index].publicKey,
					rank: data[index].rank,
					username: data[index].username,
				}),
			})),
		);

		const { asFragment, container } = render(
			<table>
				<tbody>
					<AddressRow index={0} maxVotes={10} wallet={wallet} />
				</tbody>
			</table>,
		);

		expect(container).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();

		votesMock.mockRestore();
	});

	it("should render for a multisignature wallet", async () => {
		const isMultiSignatureSpy = jest.spyOn(wallet, "isMultiSignature").mockImplementation(() => true);
		const { asFragment, container, getByTestId } = render(
			<table>
				<tbody>
					<AddressRow index={0} maxVotes={1} wallet={wallet} />
				</tbody>
			</table>,
		);

		expect(container).toBeTruthy();

		await waitFor(() => expect(getByTestId("AddressRow__status")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();

		isMultiSignatureSpy.mockRestore();
	});

	it("should render when wallet not found for votes", async () => {
		const { asFragment, getByTestId } = render(
			<table>
				<tbody>
					<AddressRow index={0} maxVotes={1} wallet={wallet} />
					<AddressRow index={1} maxVotes={1} wallet={blankWallet} />
				</tbody>
			</table>,
		);

		await waitFor(() => expect(getByTestId("AddressRow__status")).toBeTruthy());
		await waitFor(() => expect(getByTestId("AddressRow__select-0")).toBeTruthy());
		await waitFor(() => expect(getByTestId("AddressRow__select-1")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render when wallet hasn't voted", async () => {
		const { asFragment, getAllByTestId, getByTestId } = render(
			<table>
				<tbody>
					<AddressRow index={0} maxVotes={1} wallet={wallet} />
					<AddressRow index={1} maxVotes={1} wallet={unvotedWallet} />
				</tbody>
			</table>,
		);

		await waitFor(() => expect(getAllByTestId("AddressRow__status")).toBeTruthy());
		await waitFor(() => expect(getByTestId("AddressRow__select-0")).toBeTruthy());
		await waitFor(() => expect(getByTestId("AddressRow__select-1")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should emit action on select button", async () => {
		await wallet.synchroniser().identity();
		await wallet.synchroniser().votes();
		await wallet.synchroniser().coin();

		const onSelect = jest.fn();
		const { asFragment, container, getByTestId } = render(
			<table>
				<tbody>
					<AddressRow index={0} maxVotes={1} wallet={wallet} onSelect={onSelect} />
				</tbody>
			</table>,
		);
		const selectButton = getByTestId("AddressRow__select-0");

		await waitFor(() => expect(getByTestId("AddressRow__status")).toBeTruthy());

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(container).toBeTruthy();
		expect(onSelect).toHaveBeenCalledWith(wallet.address());
		expect(asFragment()).toMatchSnapshot();
	});
});
