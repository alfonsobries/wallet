/* eslint-disable @typescript-eslint/require-await */
import { BIP39 } from "@payvo/cryptography";
import { Contracts } from "@payvo/profiles";
import { act } from "@testing-library/react-hooks";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import {
	act as actAsync,
	env,
	fireEvent,
	getDefaultProfileId,
	MNEMONICS,
	renderWithRouter,
	waitFor,
} from "utils/testing-library";

import { CreateWallet } from "./CreateWallet";

let profile: Contracts.IProfile;
let bip39GenerateMock: any;

const passphrase = "power return attend drink piece found tragic fire liar page disease combine";
const fixtureProfileId = getDefaultProfileId();

describe("EncryptionPasswordStep", () => {
	beforeEach(() => {
		profile = env.profiles().findById(fixtureProfileId);

		for (const wallet of profile.wallets().values()) {
			profile.wallets().forget(wallet.id());
		}

		bip39GenerateMock = jest.spyOn(BIP39, "generate").mockReturnValue(passphrase);
	});

	afterEach(() => {
		bip39GenerateMock.mockRestore();
	});

	it("should fail creating a wallet with encryption password", async () => {
		const history = createMemoryHistory();
		const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
		history.push(createURL);

		const { queryAllByText, getByTestId, getByText, getAllByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/create">
				<CreateWallet />
			</Route>,
			{
				history,
				routes: [createURL],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");
		const continueButton = getByTestId("CreateWallet__continue-button");
		const backButton = getByTestId("CreateWallet__back-button");

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		expect(backButton).not.toHaveAttribute("disabled");

		act(() => {
			fireEvent.click(backButton);
		});

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${fixtureProfileId}/dashboard`);

		act(() => {
			fireEvent.change(selectNetworkInput, { target: { value: "Ark Dev" } });
			fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });
		});
		await waitFor(() => expect(continueButton).not.toHaveAttribute("disabled"));

		act(() => {
			fireEvent.change(selectNetworkInput, { target: { value: "" } });
		});
		await waitFor(() => expect(continueButton).toHaveAttribute("disabled"));

		act(() => {
			fireEvent.change(selectNetworkInput, { target: { value: "Ark Dev" } });
			fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });
		});

		await waitFor(() => expect(continueButton).not.toHaveAttribute("disabled"));

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(profile.wallets().values().length).toBe(0));

		await waitFor(() => expect(getByTestId("CreateWallet__WalletOverviewStep")).toBeTruthy());

		act(() => {
			fireEvent.click(backButton);
		});

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId("CreateWallet__WalletOverviewStep")).toBeTruthy());

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId("CreateWallet__ConfirmPassphraseStep")).toBeTruthy());

		act(() => {
			fireEvent.click(backButton);
		});

		await waitFor(() => expect(getByTestId("CreateWallet__WalletOverviewStep")).toBeTruthy());

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId("CreateWallet__ConfirmPassphraseStep")).toBeTruthy());

		const walletMnemonic = passphrase.split(" ");
		for (let index = 0; index < 3; index++) {
			const wordNumber = Number.parseInt(getByText(/Select the/).innerHTML.replace(/Select the/, ""));

			await actAsync(async () => {
				fireEvent.click(getByText(walletMnemonic[wordNumber - 1]));
				if (index < 2) {
					await waitFor(() => expect(queryAllByText(/The #(\d+) word/).length === 2 - index));
				}
			});
		}
		await waitFor(() => expect(continueButton).not.toHaveAttribute("disabled"));

		act(() => {
			fireEvent.click(continueButton);
		});

		//@ts-ignore
		const walletSpy = jest.spyOn(profile, "walletFactory").mockImplementation(() => ({
			fromMnemonicWithBIP39: () => Promise.reject(new Error("failed")),
		}));

		await waitFor(() => expect(getByTestId("EncryptPassword")).toBeTruthy());

		const passwordInput = getAllByTestId("InputPassword")[0];
		const confirmPassword = getAllByTestId("InputPassword")[1];

		actAsync(() => {
			fireEvent.input(passwordInput, { target: { value: "S3cUrePa$sword" } });
		});

		await waitFor(() => expect(passwordInput).toHaveValue("S3cUrePa$sword"));

		actAsync(() => {
			fireEvent.input(confirmPassword, { target: { value: "S3cUrePa$sword" } });
		});

		await waitFor(() => expect(confirmPassword).toHaveValue("S3cUrePa$sword"));

		actAsync(() => {
			fireEvent.click(getByTestId("CreateWallet__continue-encryption-button"));
		});
		await waitFor(() => expect(getByTestId("CreateWallet__SuccessStep")).toBeTruthy());

		act(() => {
			fireEvent.click(getByTestId("CreateWallet__finish-button"));
		});

		await waitFor(() => expect(walletSpy).toHaveBeenCalled());
		walletSpy.mockRestore();
	});

	it("should create a wallet and use encryption password", async () => {
		const history = createMemoryHistory();
		const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
		history.push(createURL);

		const { queryAllByText, getByTestId, getByText, getAllByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/create">
				<CreateWallet />
			</Route>,
			{
				history,
				routes: [createURL],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");
		const continueButton = getByTestId("CreateWallet__continue-button");
		const backButton = getByTestId("CreateWallet__back-button");

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		expect(backButton).not.toHaveAttribute("disabled");

		act(() => {
			fireEvent.click(backButton);
		});

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${fixtureProfileId}/dashboard`);

		act(() => {
			fireEvent.change(selectNetworkInput, { target: { value: "Ark Dev" } });
			fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });
		});
		await waitFor(() => expect(continueButton).not.toHaveAttribute("disabled"));

		act(() => {
			fireEvent.change(selectNetworkInput, { target: { value: "" } });
		});
		await waitFor(() => expect(continueButton).toHaveAttribute("disabled"));

		act(() => {
			fireEvent.change(selectNetworkInput, { target: { value: "Ark Dev" } });
			fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });
		});

		await waitFor(() => expect(continueButton).not.toHaveAttribute("disabled"));

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId("CreateWallet__WalletOverviewStep")).toBeTruthy());

		act(() => {
			fireEvent.click(backButton);
		});

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId("CreateWallet__WalletOverviewStep")).toBeTruthy());

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId("CreateWallet__ConfirmPassphraseStep")).toBeTruthy());

		act(() => {
			fireEvent.click(backButton);
		});

		await waitFor(() => expect(getByTestId("CreateWallet__WalletOverviewStep")).toBeTruthy());

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId("CreateWallet__ConfirmPassphraseStep")).toBeTruthy());

		const walletMnemonic = passphrase.split(" ");
		for (let index = 0; index < 3; index++) {
			const wordNumber = Number.parseInt(getByText(/Select the/).innerHTML.replace(/Select the/, ""));

			await actAsync(async () => {
				fireEvent.click(getByText(walletMnemonic[wordNumber - 1]));
				if (index < 2) {
					await waitFor(() => expect(queryAllByText(/The #(\d+) word/).length === 2 - index));
				}
			});
		}
		await waitFor(() => expect(continueButton).not.toHaveAttribute("disabled"));

		act(() => {
			fireEvent.click(continueButton);
		});

		const sampleWallet = profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[0],
			network: "ark.devnet",
		});

		//@ts-ignore
		const walletSpy = jest.spyOn(profile, "walletFactory").mockImplementation(() => ({
			fromMnemonicWithBIP39: () => Promise.resolve(sampleWallet),
		}));

		await waitFor(() => expect(getByTestId("EncryptPassword")).toBeTruthy());

		const passwordInput = getAllByTestId("InputPassword")[0];
		const confirmPassword = getAllByTestId("InputPassword")[1];

		actAsync(() => {
			fireEvent.input(passwordInput, { target: { value: "S3cUrePa$sword" } });
		});

		await waitFor(() => expect(passwordInput).toHaveValue("S3cUrePa$sword"));

		actAsync(() => {
			fireEvent.input(confirmPassword, { target: { value: "S3cUrePa$sword" } });
		});

		await waitFor(() => expect(confirmPassword).toHaveValue("S3cUrePa$sword"));

		expect(profile.wallets().values().length).toBe(0);

		actAsync(() => {
			fireEvent.click(getByTestId("CreateWallet__continue-encryption-button"));
		});

		await waitFor(() => expect(getByTestId("CreateWallet__SuccessStep")).toBeTruthy());

		expect(profile.wallets().values().length).toBe(1);
		expect(walletSpy).toHaveBeenCalled();

		actAsync(() => {
			fireEvent.click(getByTestId("CreateWallet__finish-button"));
		});

		const walletId = profile.wallets().first().id();

		await waitFor(() =>
			expect(historySpy).toHaveBeenCalledWith(`/profiles/${fixtureProfileId}/wallets/${walletId}`),
		);

		historySpy.mockRestore();
	});
});
