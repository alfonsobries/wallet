/* eslint-disable @typescript-eslint/require-await */
import { Contracts as ProfilesContracts } from "@payvo/profiles";
import { Contracts } from "@payvo/sdk";
import { act, renderHook } from "@testing-library/react-hooks";
import { translations } from "domains/transaction/i18n";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import delegateRegistrationFixture from "tests/fixtures/coins/ark/devnet/transactions/delegate-registration.json";
import {
	env,
	fireEvent,
	getDefaultProfileId,
	MNEMONICS,
	render,
	RenderResult,
	syncDelegates,
	waitFor,
} from "utils/testing-library";

import { DelegateRegistrationForm } from "./DelegateRegistrationForm";

let profile: ProfilesContracts.IProfile;
let wallet: ProfilesContracts.IReadWriteWallet;
let fees: Record<string, string>;

const renderComponent = async (defaultValues = { fee: "2" }) => {
	let renderer: RenderResult;
	const { result: form } = renderHook(() => useForm({ defaultValues }));

	await act(async () => {
		renderer = render(
			<FormProvider {...form.current}>
				<DelegateRegistrationForm.component activeTab={1} fees={fees} wallet={wallet} />
			</FormProvider>,
		);

		await waitFor(() => expect(renderer.getByTestId("DelegateRegistrationForm__form-step")));
	});

	return {
		...renderer!,
		form: form.current,
	};
};

const createTransactionMock = (wallet: ProfilesContracts.IReadWriteWallet) =>
	// @ts-ignore
	jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
		amount: () => +delegateRegistrationFixture.data.amount / 1e8,
		data: () => ({ data: () => delegateRegistrationFixture.data }),
		explorerLink: () => `https://dexplorer.ark.io/transaction/${delegateRegistrationFixture.data.id}`,
		fee: () => +delegateRegistrationFixture.data.fee / 1e8,
		id: () => delegateRegistrationFixture.data.id,
		recipient: () => delegateRegistrationFixture.data.recipient,
		sender: () => delegateRegistrationFixture.data.sender,
		username: () => delegateRegistrationFixture.data.asset.delegate.username,
	});

describe("DelegateRegistrationForm", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		await env.profiles().restore(profile);
		await profile.sync();

		wallet = profile.wallets().first();

		await syncDelegates(profile);

		fees = {
			avg: "1.354",
			max: "10",
			min: "0",
		};
	});

	it("should render form step", async () => {
		const { asFragment } = await renderComponent();

		await waitFor(() => expect(asFragment()).toMatchSnapshot());
	});

	it("should render review step", async () => {
		const { asFragment, form, getByTestId, rerender } = await renderComponent();

		rerender(
			<FormProvider {...form}>
				<DelegateRegistrationForm.component activeTab={2} fees={fees} wallet={wallet} />
			</FormProvider>,
		);

		await waitFor(() => expect(getByTestId("DelegateRegistrationForm__review-step")));
		await waitFor(() => expect(asFragment()).toMatchSnapshot());
	});

	it("should set username", async () => {
		const { asFragment, form, getByTestId, rerender } = await renderComponent();

		const input = getByTestId("Input__username");
		await act(async () => {
			fireEvent.change(input, { target: { value: "test_delegate" } });
		});

		await act(async () => {
			rerender(
				<FormProvider {...form}>
					<DelegateRegistrationForm.component activeTab={1} fees={fees} wallet={wallet} />
				</FormProvider>,
			);

			await waitFor(() => expect(getByTestId("DelegateRegistrationForm__form-step")));
		});

		await waitFor(() => expect(input).toHaveValue("test_delegate"));
		await waitFor(() => expect(form.getValues("username")).toEqual("test_delegate"));
		await waitFor(() => expect(asFragment()).toMatchSnapshot());
	});

	it("should set fee", async () => {
		const { asFragment, form, getByTestId, getByText, rerender } = await renderComponent({ fee: "10" });
		form.register("inputFeeSettings" as any);

		await act(async () => {
			fireEvent.click(getByText(translations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		});

		await act(async () => {
			rerender(
				<FormProvider {...form}>
					<DelegateRegistrationForm.component activeTab={1} fees={fees} wallet={wallet} />
				</FormProvider>,
			);

			await waitFor(() => expect(getByTestId("DelegateRegistrationForm__form-step")));
		});

		await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue("10"));

		await act(async () => {
			fireEvent.change(getByTestId("InputCurrency"), {
				target: {
					value: "11",
				},
			});
		});

		await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue("11"));
		await waitFor(() => expect(asFragment()).toMatchSnapshot());
	});

	it("should show error if username contains illegal characters", async () => {
		const { asFragment, form, getByTestId, rerender } = await renderComponent();

		await act(async () => {
			fireEvent.change(getByTestId("Input__username"), { target: { value: "<invalid>" } });
		});

		await act(async () => {
			rerender(
				<FormProvider {...form}>
					<DelegateRegistrationForm.component activeTab={1} fees={fees} wallet={wallet} />
				</FormProvider>,
			);

			await waitFor(() => expect(getByTestId("DelegateRegistrationForm__form-step")));
		});

		expect(getByTestId("Input__username")).toHaveAttribute("aria-invalid");
		expect(getByTestId("Input__error")).toBeVisible();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should error if username is too long", async () => {
		const { asFragment, form, getByTestId, rerender } = await renderComponent();

		await act(async () => {
			fireEvent.change(getByTestId("Input__username"), {
				target: { value: "thisisaveryveryverylongdelegatename" },
			});
		});

		await act(async () => {
			rerender(
				<FormProvider {...form}>
					<DelegateRegistrationForm.component activeTab={1} fees={fees} wallet={wallet} />
				</FormProvider>,
			);

			await waitFor(() => expect(getByTestId("DelegateRegistrationForm__form-step")));
		});

		expect(getByTestId("Input__username")).toHaveAttribute("aria-invalid");
		expect(getByTestId("Input__error")).toBeVisible();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should show error if username already exists", async () => {
		const { asFragment, form, getByTestId, rerender } = await renderComponent();

		await act(async () => {
			fireEvent.change(getByTestId("Input__username"), { target: { value: "arkx" } });
		});

		await act(async () => {
			rerender(
				<FormProvider {...form}>
					<DelegateRegistrationForm.component activeTab={1} fees={fees} wallet={wallet} />
				</FormProvider>,
			);

			await waitFor(() => expect(getByTestId("DelegateRegistrationForm__form-step")));
		});

		expect(getByTestId("Input__username")).toHaveAttribute("aria-invalid");
		expect(getByTestId("Input__error")).toBeVisible();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should sign transaction", async () => {
		const form = {
			clearErrors: jest.fn(),
			getValues: () => ({
				fee: "1",
				mnemonic: MNEMONICS[0],
				senderAddress: wallet.address(),
				username: "test_delegate",
			}),
			setError: jest.fn(),
			setValue: jest.fn(),
		};
		const signMock = jest
			.spyOn(wallet.transaction(), "signDelegateRegistration")
			.mockReturnValue(Promise.resolve(delegateRegistrationFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [delegateRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		await DelegateRegistrationForm.signTransaction({
			env,
			form,
			profile,
		});

		expect(signMock).toHaveBeenCalled();
		expect(broadcastMock).toHaveBeenCalled();
		expect(transactionMock).toHaveBeenCalled();

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
	});

	it("should output transaction details", () => {
		const translations = jest.fn((translation) => translation);
		const transaction = {
			amount: () => delegateRegistrationFixture.data.amount / 1e8,
			data: () => ({ data: () => delegateRegistrationFixture.data }),
			fee: () => delegateRegistrationFixture.data.fee / 1e8,
			id: () => delegateRegistrationFixture.data.id,
			recipient: () => delegateRegistrationFixture.data.recipient,
			sender: () => delegateRegistrationFixture.data.sender,
			username: () => delegateRegistrationFixture.data.asset.delegate.username,
		} as Contracts.SignedTransactionData;

		const { getByText } = render(
			<DelegateRegistrationForm.transactionDetails
				transaction={transaction}
				translations={translations}
				wallet={wallet}
			/>,
		);

		expect(getByText("TRANSACTION.DELEGATE_NAME")).toBeTruthy();
		expect(getByText("test_delegate")).toBeTruthy();
	});

	it("should sign transaction using password encryption", async () => {
		const walletUsesWIFMock = jest.spyOn(wallet.wif(), "exists").mockReturnValue(true);
		const walletWifMock = jest.spyOn(wallet.wif(), "get").mockImplementation(() => {
			const wif = "S9rDfiJ2ar4DpWAQuaXECPTJHfTZ3XjCPv15gjxu4cHJZKzABPyV";
			return Promise.resolve(wif);
		});

		const form = {
			clearErrors: jest.fn(),
			getValues: () => ({
				encryptionPassword: "password",
				fee: "1",
				mnemonic: MNEMONICS[0],
				senderAddress: wallet.address(),
				username: "test_delegate",
			}),
			setError: jest.fn(),
			setValue: jest.fn(),
		};
		const signMock = jest
			.spyOn(wallet.transaction(), "signDelegateRegistration")
			.mockReturnValue(Promise.resolve(delegateRegistrationFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [delegateRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		await DelegateRegistrationForm.signTransaction({
			env,
			form,
			profile,
		});

		expect(signMock).toHaveBeenCalled();
		expect(broadcastMock).toHaveBeenCalled();
		expect(transactionMock).toHaveBeenCalled();

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
		walletUsesWIFMock.mockRestore();
		walletWifMock.mockRestore();
	});
});
