import { Circle } from "app/components/Circle";
import { Icon } from "app/components/Icon";
import { Modal } from "app/components/Modal";
import {
	TransactionConfirmations,
	TransactionDetail,
	TransactionExplorerLink,
	TransactionFee,
	TransactionSender,
	TransactionTimestamp,
} from "domains/transaction/components/TransactionDetail";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
interface DelegateResignationDetailProperties {
	isOpen: boolean;
	transaction: any;
	onClose?: any;
}

export const DelegateResignationDetail = ({ isOpen, transaction, onClose }: DelegateResignationDetailProperties) => {
	const { t } = useTranslation();

	const wallet = useMemo(() => transaction.wallet(), [transaction]);

	return (
		<Modal title={t("TRANSACTION.MODAL_DELEGATE_RESIGNATION_DETAIL.TITLE")} isOpen={isOpen} onClose={onClose}>
			<TransactionSender address={transaction.sender()} alias={wallet.alias()} border={false} />

			<TransactionDetail
				label={t("TRANSACTION.DELEGATE_NAME")}
				extra={
					<Circle
						className="text-theme-text border-theme-text dark:text-theme-secondary-600 dark:border-theme-secondary-600"
						size="lg"
					>
						<Icon name="DelegateResigned" size="lg" />
					</Circle>
				}
			>
				{wallet.username()}
			</TransactionDetail>

			<TransactionFee currency={wallet.currency()} value={transaction.fee()} />

			<TransactionTimestamp timestamp={transaction.timestamp()} />

			<TransactionConfirmations transaction={transaction} />

			<TransactionExplorerLink transaction={transaction} />
		</Modal>
	);
};

DelegateResignationDetail.defaultProps = {
	isOpen: false,
};

DelegateResignationDetail.displayName = "DelegateResignationDetail";
