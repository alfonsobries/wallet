import { DTO } from "@payvo/profiles";
import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import React from "react";

import { TransactionStatus } from "../TransactionTable.models";

interface Properties {
	isSignaturePending?: boolean;
	transaction: DTO.ExtendedConfirmedTransactionData;
}

const getStatus = (isConfirmed: boolean, isSignaturePending?: boolean): TransactionStatus => {
	if (isSignaturePending) {
		return "actionRequired";
	}

	if (isConfirmed) {
		return "confirmed";
	}

	return "pending";
};

export const TransactionRowConfirmation = ({ transaction, isSignaturePending }: Properties) => {
	const status = getStatus(transaction?.isConfirmed(), isSignaturePending);
	const tooltipContent =
		status === "actionRequired" ? "Action Required" : `${transaction?.confirmations()} confirmations`;

	const iconName = {
		actionRequired: "Edit",
		confirmed: "StatusOk",
		pending: "StatusPending",
	};

	const iconStyle = {
		actionRequired: "text-theme-danger-400",
		confirmed: "text-theme-success-600",
		pending: "text-theme-warning-600",
	};

	return (
		<Tooltip content={tooltipContent}>
			<div data-testid="TransactionRowConfirmation" className="inline-flex p-1 align-middle">
				<Icon
					data-testid={`TransactionRowConfirmation__${status}`}
					name={iconName[status]}
					className={iconStyle[status]}
					size="lg"
				/>
			</div>
		</Tooltip>
	);
};
