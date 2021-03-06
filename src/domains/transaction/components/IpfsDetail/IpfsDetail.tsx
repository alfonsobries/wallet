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

interface IpfsDetailProperties {
	isOpen: boolean;
	transaction?: any;
	onClose?: any;
}

export const IpfsDetail = ({ isOpen, transaction, onClose }: IpfsDetailProperties) => {
	const { t } = useTranslation();

	const wallet = useMemo(() => transaction.wallet(), [transaction]);

	return (
		<Modal title={t("TRANSACTION.MODAL_IPFS_DETAIL.TITLE")} isOpen={isOpen} onClose={onClose}>
			<TransactionSender
				address={transaction.sender()}
				alias={wallet.alias()}
				isDelegate={wallet.isDelegate() && !wallet.isResignedDelegate()}
				border={false}
			/>

			<TransactionFee currency={wallet.currency()} value={transaction.fee()} />

			<TransactionDetail
				label={t("TRANSACTION.IPFS_HASH")}
				extra={
					<Circle
						className="text-theme-secondary-900 border-theme-secondary-900 dark:text-theme-secondary-600 dark:border-theme-secondary-600"
						size="lg"
					>
						<Icon
							name="Ipfs"
							className="text-theme-secondary-900 dark:text-theme-secondary-600"
							size="lg"
						/>
					</Circle>
				}
			>
				{transaction.hash()}
			</TransactionDetail>

			<TransactionTimestamp timestamp={transaction.timestamp()} />

			<TransactionConfirmations transaction={transaction} />

			<TransactionExplorerLink transaction={transaction} />
		</Modal>
	);
};

IpfsDetail.defaultProps = {
	isOpen: false,
};

IpfsDetail.displayName = "IpfsDetail";
