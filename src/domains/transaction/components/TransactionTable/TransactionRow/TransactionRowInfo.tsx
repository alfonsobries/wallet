import { DTO } from "@payvo/profiles";
import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import React from "react";
import { useTranslation } from "react-i18next";

interface Properties {
	memo?: string;
	isMultiSignatureRegistration: boolean;
	isLedger?: boolean;
}

export const BaseTransactionRowInfo = ({ memo, isMultiSignatureRegistration, isLedger }: Properties) => {
	const { t } = useTranslation();

	return (
		<div
			data-testid="TransactionRowInfo"
			className="inline-flex space-x-1 align-middle text-theme-text dark:text-theme-secondary-600"
		>
			{isLedger && (
				<Tooltip content={t("COMMON.LEDGER")}>
					<span className="p-1">
						<Icon data-testid="TransactionRowInfo__ledger" name="Ledger" size="lg" />
					</span>
				</Tooltip>
			)}

			{isMultiSignatureRegistration && (
				<Tooltip content={t("COMMON.MULTISIGNATURE")}>
					<span className="p-1">
						<Icon data-testid="TransactionRowInfo__multiSignature" name="Multisig" size="lg" />
					</span>
				</Tooltip>
			)}

			{memo && (
				<Tooltip className="break-all" content={memo}>
					<span className="p-1">
						<Icon data-testid="TransactionRowInfo__vendorField" name="Memo" size="lg" />
					</span>
				</Tooltip>
			)}
		</div>
	);
};

export const TransactionRowInfo = ({ transaction }: { transaction: DTO.ExtendedConfirmedTransactionData }) => (
	<BaseTransactionRowInfo
		memo={transaction.memo()}
		isMultiSignatureRegistration={transaction.isMultiSignatureRegistration()}
		isLedger={transaction.wallet()?.isLedger()}
	/>
);
