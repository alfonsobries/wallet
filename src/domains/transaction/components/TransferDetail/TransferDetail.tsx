import { Modal } from "app/components/Modal";
import {
	TransactionAmount,
	TransactionConfirmations,
	TransactionExplorerLink,
	TransactionFee,
	TransactionMemo,
	TransactionRecipients,
	TransactionSender,
	TransactionTimestamp,
} from "domains/transaction/components/TransactionDetail";
import { TransactionAliases } from "domains/transaction/components/TransactionDetailModal/TransactionDetailModal.models";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface TransferDetailProperties {
	isOpen: boolean;
	aliases?: TransactionAliases;
	transaction: any;
	onClose?: any;
}

export const TransferDetail = ({ isOpen, aliases, transaction, onClose }: TransferDetailProperties) => {
	const { t } = useTranslation();

	const wallet = useMemo(() => transaction.wallet(), [transaction]);

	const recipients = [
		{
			address: transaction.recipient(),
			alias: aliases?.recipients[0].alias,
			isDelegate: aliases?.recipients[0].isDelegate,
		},
	];

	return (
		<Modal title={t("TRANSACTION.MODAL_TRANSFER_DETAIL.TITLE")} isOpen={isOpen} onClose={onClose}>
			<TransactionSender
				address={transaction.sender()}
				alias={aliases?.sender.alias}
				isDelegate={aliases?.sender.isDelegate}
				border={false}
			/>

			<TransactionRecipients currency={wallet.currency()} recipients={recipients} />

			<TransactionAmount
				amount={transaction.amount()}
				convertedAmount={transaction.convertedAmount()}
				currency={wallet.currency()}
				exchangeCurrency={wallet.exchangeCurrency()}
				isSent={transaction.isSent()}
			/>

			<TransactionFee currency={wallet.currency()} value={transaction.fee()} />

			{transaction.memo() && <TransactionMemo memo={transaction.memo()} />}

			<TransactionTimestamp timestamp={transaction.timestamp()} />

			<TransactionConfirmations transaction={transaction} />

			<TransactionExplorerLink transaction={transaction} />
		</Modal>
	);
};

TransferDetail.defaultProps = {
	isOpen: false,
};

TransferDetail.displayName = "TransferDetail";
