import { Contracts as ProfileContracts } from "@payvo/profiles";
import { Services, Signatories } from "@payvo/sdk";
import { useLedgerContext } from "app/contexts";
import { Participant } from "domains/transaction/components/MultiSignatureRegistrationForm/components/AddParticipant/AddParticipant";
import { ExtendedSignedTransactionData } from "domains/transaction/pages/SendRegistration/SendRegistration.models";
import { handleBroadcastError, withAbortPromise } from "domains/transaction/utils";
import { useRef } from "react";

interface SendMultisignatureProperties {
	wallet: ProfileContracts.IReadWriteWallet;
	participants: Participant[];
	minParticipants: number;
	fee: Services.TransactionFee;
	signatory: Signatories.Signatory;
}

interface AddSignatureProperties {
	transactionId: string;
	signatory: Signatories.Signatory;
	wallet: ProfileContracts.IReadWriteWallet;
}

export const useMultiSignatureRegistration = () => {
	const { abortConnectionRetry } = useLedgerContext();
	const abortReference = useRef(new AbortController());

	const signWithLedger = async (wallet: ProfileContracts.IReadWriteWallet) => {
		const prepareLedger = () =>
			wallet.signatory().ledger(wallet.data().get<string>(ProfileContracts.WalletData.DerivationPath)!);

		return withAbortPromise(abortReference.current?.signal, abortConnectionRetry)(prepareLedger());
	};

	const addSignature = async ({ transactionId, signatory, wallet }: AddSignatureProperties) => {
		if (wallet.isLedger()) {
			const ledgerSignatory = await signWithLedger(wallet);
			return wallet.transaction().addSignature(transactionId, ledgerSignatory);
		}

		return wallet.transaction().addSignature(transactionId, signatory);
	};

	const sendMultiSignature = async ({
		wallet,
		participants,
		minParticipants,
		fee,
		signatory,
	}: SendMultisignatureProperties) => {
		// TODO: Handle ledger wallets without public keys (use derivation path)
		const publicKeys = participants.map((item) => item.publicKey);

		const input: Services.MultiSignatureInput = {
			data: {
				min: +minParticipants,
				publicKeys: [...publicKeys],
				senderPublicKey: wallet.publicKey(),
			},
			fee: +fee,
			nonce: wallet.nonce().plus(1).toString(),
			signatory: await wallet
				.coin()
				.signatory()
				.multiSignature(+minParticipants, publicKeys),
		};

		// 1. Sign using public keys
		const transactionId = await wallet.transaction().signMultiSignature(input);

		// 2. Add sender's signature and broadcast
		const response = await addSignature({ signatory, transactionId, wallet });
		handleBroadcastError(response);

		await wallet.transaction().sync();

		const transaction: ExtendedSignedTransactionData = wallet.transaction().transaction(transactionId);
		transaction.generatedAddress = (
			await wallet.coin().address().fromMultiSignature(minParticipants, publicKeys)
		).address;

		return transaction;
	};

	return { abortReference, addSignature, sendMultiSignature };
};
