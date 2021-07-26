import { Contracts, DTO } from "@payvo/profiles";
import { LedgerProvider } from "app/contexts";
import { toasts } from "app/services";
import React from "react";
import MultisignatureRegistrationFixture from "tests/fixtures/coins/ark/devnet/transactions/multisignature-registration.json";
import {
	act,
	env,
	fireEvent,
	getDefaultLedgerTransport,
	getDefaultProfileId,
	getDefaultWalletMnemonic,
	render,
	screen,
	syncDelegates,
	waitFor,
} from "utils/testing-library";

import { translations } from "../../i18n";
import { MultiSignatureDetail } from "./MultiSignatureDetail";

const passphrase = getDefaultWalletMnemonic();

describe("MultiSignatureDetail", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;

	const fixtures: Record<string, any> = {
		ipfs: undefined,
		multiPayment: undefined,
		multiSignature: undefined,
		transfer: undefined,
		unvote: undefined,
		vote: undefined,
	};

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		await env.profiles().restore(profile);
		await profile.sync();

		await syncDelegates(profile);

		wallet = profile.wallets().first();

		await wallet.synchroniser().identity();

		fixtures.transfer = new DTO.ExtendedSignedTransactionData(
			await wallet
				.coin()
				.transaction()
				.transfer({
					data: {
						amount: 1,
						to: wallet.address(),
					},
					fee: 1,
					nonce: "1",
					signatory: await wallet
						.coin()
						.signatory()
						.multiSignature(2, [wallet.publicKey()!, profile.wallets().last().publicKey()!]),
				}),
			wallet,
		);

		fixtures.multiSignature = new DTO.ExtendedSignedTransactionData(
			await wallet
				.coin()
				.transaction()
				.multiSignature({
					data: {
						min: 2,
						publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
						senderPublicKey: wallet.publicKey()!,
					},
					fee: 1,
					nonce: "1",
					signatory: await wallet
						.coin()
						.signatory()
						.multiSignature(2, [wallet.publicKey()!, profile.wallets().last().publicKey()!]),
				}),
			wallet,
		);

		fixtures.multiPayment = new DTO.ExtendedSignedTransactionData(
			await wallet
				.coin()
				.transaction()
				.multiPayment({
					data: {
						payments: [
							{
								amount: 1,
								to: wallet.address(),
							},
							{
								amount: 2,
								to: wallet.address(),
							},
						],
					},
					fee: 1,
					nonce: "1",
					signatory: await wallet
						.coin()
						.signatory()
						.multiSignature(2, [wallet.publicKey()!, profile.wallets().last().publicKey()!]),
				}),
			wallet,
		);

		fixtures.vote = new DTO.ExtendedSignedTransactionData(
			await wallet
				.coin()
				.transaction()
				.vote({
					data: {
						unvotes: [],
						votes: [
							{
								amount: 0,
								id: "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
							},
						],
					},
					fee: 1,
					nonce: "1",
					signatory: await wallet
						.coin()
						.signatory()
						.multiSignature(2, [wallet.publicKey()!, profile.wallets().last().publicKey()!]),
				}),
			wallet,
		);

		fixtures.unvote = new DTO.ExtendedSignedTransactionData(
			await wallet
				.coin()
				.transaction()
				.vote({
					data: {
						unvotes: [
							{
								amount: 0,
								id: "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
							},
						],
						votes: [],
					},
					fee: 1,
					nonce: "1",
					signatory: await wallet
						.coin()
						.signatory()
						.multiSignature(2, [wallet.publicKey()!, profile.wallets().last().publicKey()!]),
				}),
			wallet,
		);

		fixtures.ipfs = new DTO.ExtendedSignedTransactionData(
			await wallet
				.coin()
				.transaction()
				.ipfs({
					data: {
						hash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
					},
					fee: 1,
					nonce: "1",
					signatory: await wallet
						.coin()
						.signatory()
						.multiSignature(2, [wallet.publicKey()!, profile.wallets().last().publicKey()!]),
				}),
			wallet,
		);
	});

	it("should render summary step for transfer", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);

		const { container } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByText(translations.TRANSACTION_TYPES.TRANSFER)));

		expect(container).toMatchSnapshot();
	});

	it("should render summary step and handle exception", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => {
			throw new Error("error");
		});

		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);

		const { container } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByText(translations.TRANSACTION_TYPES.TRANSFER)));

		expect(container).toMatchSnapshot();
	});

	it("should render summary step for multi payment", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);

		const { container } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.multiPayment} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByText(translations.TRANSACTION_TYPES.MULTI_PAYMENT)));

		expect(container).toMatchSnapshot();
	});

	it("should render summary step for multi signature", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);

		const { container } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.multiSignature} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByText(translations.TRANSACTION_TYPES.MULTI_SIGNATURE)));

		expect(container).toMatchSnapshot();
	});

	it("should render summary step for vote", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);
		jest.spyOn(fixtures.vote, "type").mockReturnValue("vote");

		const { container } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.vote} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() =>
			expect(screen.getByTestId("header__title")).toHaveTextContent(translations.TRANSACTION_TYPES.VOTE),
		);

		expect(container).toMatchSnapshot();
	});

	it("should render summary step for unvote", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);
		jest.spyOn(fixtures.unvote, "type").mockReturnValue("unvote");

		const { container } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.unvote} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() =>
			expect(screen.getByTestId("header__title")).toHaveTextContent(translations.TRANSACTION_TYPES.UNVOTE),
		);

		expect(container).toMatchSnapshot();
	});

	it("should render summary step for ipfs", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);

		const { container } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.ipfs} wallet={wallet} isOpen />
			</LedgerProvider>,
		);
		await waitFor(() =>
			expect(screen.getByTestId("header__title")).toHaveTextContent(translations.TRANSACTION_TYPES.IPFS),
		);

		expect(container).toMatchSnapshot();
	});

	it("should show send button when able to broadcast", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		// @ts-ignore
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue(void 0);

		const { container } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("MultiSignatureDetail__broadcast")));

		expect(container).toMatchSnapshot();

		act(() => {
			fireEvent.click(screen.getByTestId("MultiSignatureDetail__broadcast"));
		});

		await waitFor(() => expect(broadcastMock).toHaveBeenCalled());
		await waitFor(() => expect(screen.getByText(translations.SUCCESS.TITLE)).toBeInTheDocument());

		broadcastMock.mockRestore();
	});

	it("should not show send button when waiting for confirmations", async () => {
		jest.spyOn(wallet.transaction(), "isAwaitingConfirmation").mockImplementationOnce(() => true);
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);

		const { container } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.queryByTestId("MultiSignatureDetail__broadcast")).not.toBeInTheDocument());

		expect(container).toMatchSnapshot();
	});

	it("should fail to broadcast transaction and show error step", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockRejectedValue(new Error("Failed"));

		const { container } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("MultiSignatureDetail__broadcast")));

		expect(container).toMatchSnapshot();

		act(() => {
			fireEvent.click(screen.getByTestId("MultiSignatureDetail__broadcast"));
		});

		await waitFor(() => expect(screen.getByTestId("ErrorStep")));
		await waitFor(() => expect(broadcastMock).toHaveBeenCalled());
		broadcastMock.mockRestore();
	});

	it("should show paginator when able to sign", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);

		const { container } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("Paginator__sign")));

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__sign"));
		});

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep")));

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__back"));
		});

		await waitFor(() => expect(screen.getByTestId("Paginator__sign")));

		expect(container).toMatchSnapshot();
	});

	it("should emit close when click on cancel button", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);

		const onClose = jest.fn();
		render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail
					profile={profile}
					transaction={fixtures.transfer}
					wallet={wallet}
					isOpen
					onClose={onClose}
				/>
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("Paginator__cancel")));

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__cancel"));
		});

		expect(onClose).toHaveBeenCalled();
	});

	it("should go to authentication step with sign button", async () => {
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);

		render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("Paginator__sign")));

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__sign"));
		});

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep")).toBeInTheDocument());
	});

	it("should sign transaction after authentication page", async () => {
		jest.spyOn(wallet, "actsWithMnemonic").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "sync").mockResolvedValue(void 0);

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast");
		const addSignatureMock = jest.spyOn(wallet.transaction(), "addSignature").mockResolvedValue(void 0);

		const { container } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("Paginator__sign")));

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__sign"));
		});

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep")).toBeInTheDocument());

		act(() => {
			fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: passphrase,
				},
			});
		});

		await waitFor(() => expect(screen.getByTestId("Paginator__continue")).not.toBeDisabled(), { timeout: 1000 });

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__continue"));
		});

		await waitFor(() => expect(addSignatureMock).toHaveBeenCalled());
		await waitFor(() => expect(broadcastMock).not.toHaveBeenCalled());
		await waitFor(() => expect(screen.getByText(translations.SUCCESS.TITLE)).toBeInTheDocument());

		expect(container).toMatchSnapshot();
	});

	it("should fail to sign transaction after authentication page", async () => {
		jest.spyOn(wallet, "actsWithMnemonic").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "sync").mockResolvedValue(void 0);

		const addSignatureMock = jest
			.spyOn(wallet.transaction(), "addSignature")
			.mockRejectedValue(new Error("Failed"));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast");
		const toastsMock = jest.spyOn(toasts, "error");

		render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("Paginator__sign")));

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__sign"));
		});

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep")).toBeInTheDocument());

		act(() => {
			fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: passphrase,
				},
			});
		});

		await waitFor(() => expect(screen.getByTestId("Paginator__continue")).not.toBeDisabled(), { timeout: 1000 });

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__continue"));
		});

		await waitFor(() => expect(addSignatureMock).toHaveBeenCalled());
		await waitFor(() => expect(toastsMock).toHaveBeenCalled());
		await waitFor(() => expect(broadcastMock).not.toHaveBeenCalled());
	});

	it("should sign transaction with a ledger wallet", async () => {
		jest.spyOn(wallet, "actsWithMnemonic").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "sync").mockResolvedValue(void 0);

		// Ledger mocks
		const isLedgerMock = jest.spyOn(wallet, "isLedger").mockImplementation(() => true);
		jest.spyOn(wallet.coin(), "__construct").mockImplementation();

		const getPublicKeyMock = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockResolvedValue("0335a27397927bfa1704116814474d39c2b933aabb990e7226389f022886e48deb");

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [MultisignatureRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});

		const addSignatureMock = jest.spyOn(wallet.transaction(), "addSignature").mockResolvedValue(undefined);

		const addSignatureSpy = jest.spyOn(wallet.transaction(), "addSignature").mockResolvedValue(undefined);

		const { container } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<MultiSignatureDetail profile={profile} transaction={fixtures.multiSignature} wallet={wallet} isOpen />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("Paginator__sign")));

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__sign"));
		});

		await waitFor(() => expect(screen.getByTestId("Paginator__continue")).not.toBeDisabled(), { timeout: 1000 });

		await waitFor(() => expect(addSignatureMock).toHaveBeenCalled());
		await waitFor(() => expect(broadcastMock).not.toHaveBeenCalled());
		await waitFor(() => expect(screen.getByText(translations.SUCCESS.TITLE)).toBeInTheDocument());

		expect(container).toMatchSnapshot();

		isLedgerMock.mockRestore();
		getPublicKeyMock.mockRestore();
		broadcastMock.mockRestore();
		addSignatureSpy.mockRestore();
	});
});
