import { Address } from "app/components/Address";
import { Avatar } from "app/components/Avatar";
import { Circle } from "app/components/Circle";
import { Icon } from "app/components/Icon";
import React from "react";
import { useTranslation } from "react-i18next";

import { TransactionDetail, TransactionDetailProperties } from "../TransactionDetail";

type TransactionSenderProperties = {
	address: string;
	alias?: string;
	isDelegate?: boolean;
} & TransactionDetailProperties;

export const TransactionSender = ({ address, alias, isDelegate, ...properties }: TransactionSenderProperties) => {
	const { t } = useTranslation();

	return (
		<TransactionDetail
			data-testid="TransactionSender"
			label={t("TRANSACTION.SENDER")}
			extra={
				<div className="flex items-center -space-x-2">
					{isDelegate && (
						<Circle
							className="border-theme-text text-theme-text dark:border-theme-secondary-600 dark:text-theme-secondary-600"
							size="lg"
						>
							<Icon name="Delegate" size="lg" />
						</Circle>
					)}
					<Avatar address={address} size="lg" />
				</div>
			}
			{...properties}
		>
			<Address address={address} walletName={alias} />
		</TransactionDetail>
	);
};

TransactionSender.defaultProps = {
	borderPosition: "top",
};
