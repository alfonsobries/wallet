import { DTO } from "@payvo/profiles";
import { Button } from "app/components/Button";
import { Icon } from "app/components/Icon";
import { Link } from "app/components/Link";
import { TableCell, TableRow } from "app/components/Table";
import { useTimeFormat } from "app/hooks/use-time-format";
import cn from "classnames";
import React, { memo } from "react";

import { TransactionRowAmount } from "./TransactionRowAmount";
import { TransactionRowConfirmation } from "./TransactionRowConfirmation";
import { TransactionRowInfo } from "./TransactionRowInfo";
import { TransactionRowMode } from "./TransactionRowMode";
import { TransactionRowRecipientLabel } from "./TransactionRowRecipientLabel";
import { TransactionRowSkeleton } from "./TransactionRowSkeleton";

type Properties = {
	transaction: DTO.ExtendedConfirmedTransactionData;
	exchangeCurrency?: string;
	onSign?: () => void;
	onClick?: () => void;
	walletName?: string;
	isLoading?: boolean;
	showExplorerLink?: boolean;
	showSignColumn?: boolean;
} & React.HTMLProps<any>;

export const TransactionRow = memo(
	({
		className,
		exchangeCurrency,
		transaction,
		onSign,
		onClick,
		walletName,
		isLoading = false,
		showExplorerLink = true,
		showSignColumn = false,
		...properties
	}: Properties) => {
		const timeFormat = useTimeFormat();

		if (isLoading) {
			return (
				<TransactionRowSkeleton
					data-testid="TransactionRow__skeleton"
					showCurrencyColumn={!!exchangeCurrency}
					showSignColumn={showSignColumn}
				/>
			);
		}

		const isSignaturePending = showSignColumn && transaction.isMultiSignatureRegistration();

		let lastCellContent = undefined;

		if (isSignaturePending) {
			lastCellContent = (
				<Button data-testid="TransactionRow__sign" variant="secondary" onClick={onSign}>
					<Icon name="Edit" />
					<span>Sign</span>
				</Button>
			);
		}

		if (exchangeCurrency && !lastCellContent) {
			if (transaction.wallet().network().isTest()) {
				lastCellContent = (
					<span data-testid="TransactionRow__currency" className="whitespace-nowrap">
						N/A
					</span>
				);
			} else {
				lastCellContent = (
					<span data-testid="TransactionRow__currency" className="whitespace-nowrap">
						<TransactionRowAmount transaction={transaction} exchangeCurrency={exchangeCurrency} />
					</span>
				);
			}
		}

		return (
			<TableRow onClick={onClick} className={cn("group", className)} {...properties}>
				{showExplorerLink && (
					<TableCell variant="start">
						<Link
							data-testid="TransactionRow__ID"
							to={transaction.explorerLink()}
							tooltip={transaction.id()}
							showExternalIcon={false}
							isExternal
						>
							<Icon name="Id" />
						</Link>
					</TableCell>
				)}

				<TableCell variant={showExplorerLink ? "middle" : "start"} innerClassName="text-theme-secondary-text">
					<span data-testid="TransactionRow__timestamp" className="whitespace-nowrap">
						{transaction.timestamp()!.format(timeFormat)}
					</span>
				</TableCell>

				<TableCell innerClassName="flex space-x-4">
					<TransactionRowMode transaction={transaction} />
					<div className="w-40 flex-1">
						<TransactionRowRecipientLabel transaction={transaction} walletName={walletName} />
					</div>
				</TableCell>

				<TableCell innerClassName="justify-center">
					<TransactionRowInfo transaction={transaction} />
				</TableCell>

				<TableCell className="w-16" innerClassName="justify-center">
					<TransactionRowConfirmation transaction={transaction} />
				</TableCell>

				<TableCell innerClassName="justify-end">
					<TransactionRowAmount
						transaction={transaction}
						exchangeCurrency={exchangeCurrency}
						exchangeTooltip
					/>
				</TableCell>

				<TableCell variant="end" className="hidden xl:block" innerClassName="justify-end">
					{lastCellContent}
				</TableCell>
			</TableRow>
		);
	},
);

TransactionRow.displayName = "TransactionRow";
