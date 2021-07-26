import { Contracts, DTO } from "@payvo/profiles";
import { useWalletAlias } from "app/hooks";
import { RecipientListItem } from "domains/transaction/components/RecipientList/RecipientList.models";
import {
	TransactionAmount,
	TransactionFee,
	TransactionRecipients,
} from "domains/transaction/components/TransactionDetail";
import { TransactionSuccessful } from "domains/transaction/components/TransactionSuccessful";
import React from "react";

export const SummaryStep = ({
	profile,
	senderWallet,
	transaction,
}: {
	profile: Contracts.IProfile;
	senderWallet: Contracts.IReadWriteWallet;
	transaction: DTO.ExtendedSignedTransactionData;
}): JSX.Element => {
	const { getWalletAlias } = useWalletAlias();

	const recipients: RecipientListItem[] = transaction.recipients().map((recipient) => {
		const { alias, isDelegate } = getWalletAlias({
			address: recipient.address,
			network: senderWallet.network(),
			profile,
		});

		return { alias, isDelegate, ...recipient };
	});

	return (
		<TransactionSuccessful transaction={transaction} senderWallet={senderWallet}>
			<TransactionRecipients currency={senderWallet.currency()} recipients={recipients} />

			<TransactionAmount
				amount={transaction.amount()}
				currency={senderWallet.currency()}
				isMultiPayment={transaction.recipients().length > 1}
				isSent={true}
			/>

			<TransactionFee currency={senderWallet.currency()} value={transaction.fee()} paddingPosition="top" />
		</TransactionSuccessful>
	);
};
