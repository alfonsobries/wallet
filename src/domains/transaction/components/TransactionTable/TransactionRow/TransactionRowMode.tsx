import { DTO } from "@payvo/profiles";
import { Contracts } from "@payvo/sdk";
import { Circle } from "app/components/Circle";
import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import cn from "classnames";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Size } from "types";

import { TransactionRowRecipientIcon } from "./TransactionRowRecipientIcon";

interface Properties {
	type: string;
	isSent: boolean;
	isReturn?: boolean;
	recipient: string;
	iconSize?: Size;
}

export const BaseTransactionRowMode = ({ type, isSent, isReturn, recipient, iconSize = "lg" }: Properties) => {
	const { t } = useTranslation();

	const { modeIconName, tooltipContent, modeCircleStyle } = useMemo(() => {
		if (isReturn && (type === "transfer" || type === "multiPayment")) {
			return {
				modeCircleStyle: "border-theme-success-200 text-theme-success-600 dark:border-theme-success-600",
				modeIconName: "Return",
				tooltipContent: t("TRANSACTION.RETURN"),
			};
		}

		if (isSent) {
			return {
				modeCircleStyle: "border-theme-danger-100 text-theme-danger-400 dark:border-theme-danger-400",
				modeIconName: "Sent",
				tooltipContent: t("TRANSACTION.SENT"),
			};
		}

		return {
			modeCircleStyle: "border-theme-success-200 text-theme-success-600 dark:border-theme-success-600",
			modeIconName: "Received",
			tooltipContent: t("TRANSACTION.RECEIVED"),
		};
	}, [isSent, isReturn, t, type]);

	const shadowClasses =
		"ring-theme-background group-hover:ring-theme-secondary-100 group-hover:bg-theme-secondary-100 dark:group-hover:ring-black dark:group-hover:bg-black";

	return (
		<div data-testid="TransactionRowMode" className="flex items-center -space-x-1">
			<Tooltip content={tooltipContent}>
				<Circle size={iconSize} className={cn(shadowClasses, modeCircleStyle)}>
					<Icon name={modeIconName} size={iconSize} />
				</Circle>
			</Tooltip>

			<TransactionRowRecipientIcon size={iconSize} recipient={recipient} type={type} />
		</div>
	);
};

export const TransactionRowMode = ({
	iconSize = "lg",
	transaction,
}: {
	iconSize?: Size;
	transaction: DTO.ExtendedConfirmedTransactionData | Contracts.ConfirmedTransactionData;
}) => (
	<BaseTransactionRowMode
		iconSize={iconSize}
		isSent={transaction.isSent()}
		isReturn={transaction.isReturn()}
		type={transaction.type()}
		recipient={transaction.recipient()}
	/>
);
