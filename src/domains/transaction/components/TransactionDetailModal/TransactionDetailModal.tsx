import { useWalletAlias, WalletAliasResult } from "app/hooks/use-wallet-alias";
import { DelegateRegistrationDetail } from "domains/transaction/components/DelegateRegistrationDetail";
import { DelegateResignationDetail } from "domains/transaction/components/DelegateResignationDetail";
import { IpfsDetail } from "domains/transaction/components/IpfsDetail";
import { LegacyMagistrateDetail } from "domains/transaction/components/LegacyMagistrateDetail";
import { MultiPaymentDetail } from "domains/transaction/components/MultiPaymentDetail";
import { MultiSignatureRegistrationDetail } from "domains/transaction/components/MultiSignatureDetail";
import { SecondSignatureDetail } from "domains/transaction/components/SecondSignatureDetail";
import { TransferDetail } from "domains/transaction/components/TransferDetail";
import { VoteDetail } from "domains/transaction/components/VoteDetail";
import React, { useMemo } from "react";

import { TransactionAliases, TransactionDetailModalProperties } from "./TransactionDetailModal.models";

export const TransactionDetailModal = ({
	isOpen,
	transactionItem,
	profile,
	onClose,
}: TransactionDetailModalProperties) => {
	const { getWalletAlias } = useWalletAlias();

	const aliases: TransactionAliases | undefined = useMemo(() => {
		if (!transactionItem.isTransfer() && !transactionItem.isMultiPayment()) {
			return;
		}

		const sender = getWalletAlias({
			address: transactionItem.sender(),
			network: transactionItem.wallet().network(),
			profile,
		});

		const recipients: WalletAliasResult[] = [];

		if (transactionItem.isTransfer()) {
			recipients.push(
				getWalletAlias({
					address: transactionItem.recipient(),
					network: transactionItem.wallet().network(),
					profile,
				}),
			);
		}

		if (transactionItem.isMultiPayment()) {
			for (const recipient of transactionItem.recipients()) {
				recipients.push(
					getWalletAlias({
						address: recipient.address,
						network: transactionItem.wallet().network(),
						profile,
					}),
				);
			}
		}

		return { recipients, sender };
	}, [getWalletAlias, profile, transactionItem]);

	const transactionType = transactionItem.type();

	let TransactionModal;

	switch (transactionType) {
		case "transfer":
			TransactionModal = TransferDetail;
			break;
		case "multiSignature":
			TransactionModal = MultiSignatureRegistrationDetail;
			break;
		case "multiPayment":
			TransactionModal = MultiPaymentDetail;
			break;
		case "ipfs":
			TransactionModal = IpfsDetail;
			break;
		case "delegateRegistration":
			TransactionModal = DelegateRegistrationDetail;
			break;
		case "delegateResignation":
			TransactionModal = DelegateResignationDetail;
			break;
		case "vote":
		case "unvote":
		case "voteCombination":
			TransactionModal = VoteDetail;
			break;
		case "secondSignature":
			TransactionModal = SecondSignatureDetail;
			break;
		case "magistrate":
			TransactionModal = LegacyMagistrateDetail;
			break;

		default:
			break;
	}

	if (!TransactionModal) {
		throw new Error(`Transaction type [${transactionType}] is not supported.`);
	}

	return <TransactionModal isOpen={isOpen} transaction={transactionItem} aliases={aliases} onClose={onClose} />;
};

TransactionDetailModal.defaultProps = {
	isOpen: false,
};
