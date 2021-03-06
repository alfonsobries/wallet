/* eslint-disable @typescript-eslint/require-await */
import { BIP39 } from "@payvo/cryptography";
import { Contracts as ProfilesContracts } from "@payvo/profiles";
import { Contracts } from "@payvo/sdk";
import { within } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import { Form } from "app/components/Form";
import { toasts } from "app/services";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { act } from "react-test-renderer";
import secondSignatureFixture from "tests/fixtures/coins/ark/devnet/transactions/second-signature-registration.json";
import { TransactionFees } from "types";
import * as utils from "utils/electron-utils";
import { env, fireEvent, getDefaultProfileId, MNEMONICS, render, screen, waitFor } from "utils/testing-library";

import { translations as transactionTranslations } from "../../i18n";
import { SecondSignatureRegistrationForm } from "./SecondSignatureRegistrationForm";

describe("SecondSignatureRegistrationForm", () => {
	const passphrase = "power return attend drink piece found tragic fire liar page disease combine";
	let profile: ProfilesContracts.IProfile;
	let wallet: ProfilesContracts.IReadWriteWallet;
	let fees: TransactionFees;

	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();
		fees = {
			avg: "1.354",
			max: "10",
			min: "0",
		};
	});

	const createTransactionMock = (wallet: ProfilesContracts.IReadWriteWallet) =>
		// @ts-ignore
		jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
			amount: () => secondSignatureFixture.data.amount / 1e8,
			data: () => ({ data: () => secondSignatureFixture.data }),
			explorerLink: () => `https://dexplorer.ark.io/transaction/${secondSignatureFixture.data.id}`,
			fee: () => secondSignatureFixture.data.fee / 1e8,
			id: () => secondSignatureFixture.data.id,
			recipient: () => secondSignatureFixture.data.recipient,
			sender: () => secondSignatureFixture.data.sender,
		});

	const Component = ({
		form,
		onSubmit,
		activeTab = 1,
	}: {
		form: ReturnType<typeof useForm>;
		onSubmit: () => void;
		activeTab?: number;
	}) => (
		<Form context={form} onSubmit={onSubmit}>
			<SecondSignatureRegistrationForm.component
				profile={profile}
				activeTab={activeTab}
				fees={fees}
				wallet={wallet}
			/>
		</Form>
	);

	it("should render generation step", async () => {
		const { result } = renderHook(() => useForm());
		const passphrase = "mock bip39 passphrase";
		const bip39GenerateMock = jest.spyOn(BIP39, "generate").mockReturnValue(passphrase);

		act(() => {
			const { asFragment } = render(<Component form={result.current} onSubmit={() => void 0} activeTab={1} />);

			expect(asFragment()).toMatchSnapshot();
		});

		await waitFor(() => expect(result.current.getValues("secondMnemonic")).toEqual(passphrase));
		await waitFor(() => expect(screen.getByTestId("SecondSignatureRegistrationForm__generation-step")));

		bip39GenerateMock.mockRestore();
	});

	it("should set fee", async () => {
		const { result } = renderHook(() => useForm());

		result.current.register("fee");
		result.current.register("inputFeeSettings");

		const { rerender } = render(<Component form={result.current} onSubmit={() => void 0} />);

		// simple

		expect(screen.getAllByRole("radio")[1]).toBeChecked();

		act(() => {
			fireEvent.click(within(screen.getByTestId("InputFee")).getAllByRole("radio")[2]);
		});

		rerender(<Component form={result.current} onSubmit={() => void 0} />);

		expect(screen.getAllByRole("radio")[2]).toBeChecked();

		// advanced

		act(() => {
			fireEvent.click(screen.getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		});

		rerender(<Component form={result.current} onSubmit={() => void 0} />);

		expect(screen.getByTestId("InputCurrency")).toBeVisible();

		act(() => {
			fireEvent.change(screen.getByTestId("InputCurrency"), {
				target: {
					value: "9",
				},
			});
		});

		expect(screen.getByTestId("InputCurrency")).toHaveValue("9");
	});

	describe("backup step", () => {
		it("should render", async () => {
			const { result } = renderHook(() =>
				useForm({
					defaultValues: {
						secondMnemonic: "test mnemonic",
						wallet: {
							address: () => "address",
						},
					},
				}),
			);
			const { asFragment } = render(<Component form={result.current} onSubmit={() => void 0} activeTab={2} />);

			await waitFor(() =>
				expect(screen.getByTestId("SecondSignatureRegistrationForm__backup-step")).toBeTruthy(),
			);

			const writeTextMock = jest.fn();
			const clipboardOriginal = navigator.clipboard;
			// @ts-ignore
			navigator.clipboard = { writeText: writeTextMock };

			act(() => {
				fireEvent.click(screen.getByTestId("SecondSignature__copy"));
			});

			await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith("test mnemonic"));

			// @ts-ignore
			navigator.clipboard = clipboardOriginal;

			expect(asFragment()).toMatchSnapshot();
		});

		it("should show success toast on succesfull download", async () => {
			const { result } = renderHook(() =>
				useForm({
					defaultValues: {
						secondMnemonic: "test mnemonic",
						wallet: {
							address: () => "address",
						},
					},
				}),
			);

			render(<Component form={result.current} onSubmit={() => void 0} activeTab={2} />);

			jest.spyOn(utils, "saveFile").mockResolvedValueOnce("filePath");

			const toastSpy = jest.spyOn(toasts, "success");

			await act(async () => {
				fireEvent.click(screen.getByTestId("SecondSignature__download"));
			});

			expect(toastSpy).toHaveBeenCalled();

			toastSpy.mockRestore();
		});

		it("should not show success toast on cancelled download", async () => {
			const { result } = renderHook(() =>
				useForm({
					defaultValues: {
						secondMnemonic: "test mnemonic",
						wallet: {
							address: () => "address",
						},
					},
				}),
			);

			render(<Component form={result.current} onSubmit={() => void 0} activeTab={2} />);

			jest.spyOn(utils, "saveFile").mockResolvedValueOnce(undefined);

			const toastSpy = jest.spyOn(toasts, "success");

			await act(async () => {
				fireEvent.click(screen.getByTestId("SecondSignature__download"));
			});

			expect(toastSpy).not.toHaveBeenCalled();

			toastSpy.mockRestore();
		});

		it("should show error toast on error", async () => {
			const { result } = renderHook(() =>
				useForm({
					defaultValues: {
						secondMnemonic: "test mnemonic",
						wallet: {
							address: () => "address",
						},
					},
				}),
			);

			render(<Component form={result.current} onSubmit={() => void 0} activeTab={2} />);

			jest.spyOn(utils, "saveFile").mockRejectedValueOnce(new Error("Error"));

			const toastSpy = jest.spyOn(toasts, "error");

			await act(async () => {
				fireEvent.click(screen.getByTestId("SecondSignature__download"));
			});

			expect(toastSpy).toHaveBeenCalled();

			toastSpy.mockRestore();
		});
	});

	it("should render verification step", async () => {
		const { result, waitForNextUpdate } = renderHook(() =>
			useForm({
				defaultValues: {
					secondMnemonic: passphrase,
				},
			}),
		);

		render(<Component form={result.current} onSubmit={() => void 0} activeTab={3} />);

		await waitFor(() =>
			expect(screen.getByTestId("SecondSignatureRegistrationForm__verification-step")).toBeTruthy(),
		);

		expect(result.current.getValues("verification")).toBeUndefined();

		const walletMnemonic = passphrase.split(" ");

		for (let index = 0; index < 3; index++) {
			const wordNumber = Number.parseInt(screen.getByText(/Select the/).innerHTML.replace(/Select the/, ""));

			act(() => {
				fireEvent.click(screen.getByText(walletMnemonic[wordNumber - 1]));
			});

			if (index < 2) {
				await waitFor(() => expect(screen.queryAllByText(/The (\d+)/).length === 2 - index));
			}
		}

		await waitForNextUpdate();
		await waitFor(() => expect(result.current.getValues("verification")).toBe(true));
	});

	it("should render review step", async () => {
		const { result } = renderHook(() =>
			useForm({
				defaultValues: {
					fee: 0,
				},
			}),
		);

		result.current.register("fee");

		render(<Component form={result.current} onSubmit={() => void 0} activeTab={4} />);

		await waitFor(() => expect(screen.getByTestId("SecondSignatureRegistrationForm__review-step")).toBeTruthy());
	});

	it("should render transaction details", async () => {
		const DetailsComponent = () => {
			const { t } = useTranslation();
			return (
				<SecondSignatureRegistrationForm.transactionDetails
					translations={t}
					transaction={transaction}
					wallet={wallet}
				/>
			);
		};
		const transaction = {
			amount: () => secondSignatureFixture.data.amount / 1e8,
			data: () => ({ data: () => secondSignatureFixture.data }),
			fee: () => secondSignatureFixture.data.fee / 1e8,
			id: () => secondSignatureFixture.data.id,
			recipient: () => secondSignatureFixture.data.recipient,
			sender: () => secondSignatureFixture.data.sender,
		} as Contracts.SignedTransactionData;
		const { asFragment } = render(<DetailsComponent />);

		await waitFor(() => expect(screen.getByTestId("TransactionFee")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should sign transaction", async () => {
		const form = {
			clearErrors: jest.fn(),
			getValues: () => ({
				fee: "1",
				mnemonic: MNEMONICS[0],
				secondMnemonic: MNEMONICS[1],
				senderAddress: wallet.address(),
			}),
			setError: jest.fn(),
			setValue: jest.fn(),
		};
		const signMock = jest
			.spyOn(wallet.transaction(), "signSecondSignature")
			.mockReturnValue(Promise.resolve(secondSignatureFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [secondSignatureFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		await SecondSignatureRegistrationForm.signTransaction({
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

	it("should sign transaction using encryption password", async () => {
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
				senderAddress: wallet.address(),
			}),
			setError: jest.fn(),
			setValue: jest.fn(),
		};
		const signMock = jest
			.spyOn(wallet.transaction(), "signSecondSignature")
			.mockReturnValue(Promise.resolve(secondSignatureFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [secondSignatureFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		await SecondSignatureRegistrationForm.signTransaction({
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
