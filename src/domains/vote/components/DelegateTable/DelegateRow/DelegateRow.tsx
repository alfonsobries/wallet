import { Contracts } from "@payvo/profiles";
import { Avatar } from "app/components/Avatar";
import { Button } from "app/components/Button";
import { Icon } from "app/components/Icon";
import { Link } from "app/components/Link";
import { TableCell, TableRow } from "app/components/Table";
import { Tooltip } from "app/components/Tooltip";
import cn from "classnames";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DelegateRowSkeleton } from "./DelegateRowSkeleton";

interface DelegateRowProperties {
	index: number;
	delegate: Contracts.IReadOnlyWallet;
	selectedUnvotes?: string[];
	selectedVotes?: string[];
	isVoted?: boolean;
	isVoteDisabled?: boolean;
	isLoading?: boolean;
	onUnvoteSelect?: (address: string) => void;
	onVoteSelect?: (address: string) => void;
}

export const DelegateRow = ({
	index,
	delegate,
	selectedUnvotes,
	selectedVotes,
	isVoted,
	isVoteDisabled,
	isLoading,
	onUnvoteSelect,
	onVoteSelect,
}: DelegateRowProperties) => {
	const { t } = useTranslation();

	const isSelectedUnvote = useMemo(
		() => !!selectedUnvotes?.find((delegateAddress) => delegateAddress === delegate?.address?.()),
		[delegate, selectedUnvotes],
	);

	const isSelectedVote = useMemo(
		() => isVoted || !!selectedVotes?.find((delegateAddress) => delegateAddress === delegate?.address?.()),
		[delegate, isVoted, selectedVotes],
	);

	const rowColor = useMemo(() => {
		if (isVoted) {
			return !isSelectedUnvote
				? "bg-theme-primary-50 dark:bg-theme-background dark:border-theme-primary-600"
				: "bg-theme-danger-50 dark:bg-theme-background dark:border-theme-danger-400";
		}

		if (isSelectedVote) {
			return "bg-theme-info-50 dark:bg-theme-background dark:border-theme-info-600";
		}
	}, [isVoted, isSelectedVote, isSelectedUnvote]);

	if (isLoading) {
		return <DelegateRowSkeleton />;
	}

	const renderButton = () => {
		if (isVoted) {
			return (
				<Button
					variant={isSelectedUnvote ? "danger" : "primary"}
					onClick={() => onUnvoteSelect?.(delegate.address())}
					data-testid={`DelegateRow__toggle-${index}`}
				>
					{!isSelectedUnvote ? t("COMMON.CURRENT") : t("COMMON.UNSELECTED")}
				</Button>
			);
		}

		if (isVoteDisabled && !isSelectedVote) {
			return (
				<Tooltip content={t("VOTE.DELEGATE_TABLE.TOOLTIP.MAX_VOTES")}>
					<span>
						<Button variant="primary" disabled data-testid={`DelegateRow__toggle-${index}`}>
							{t("COMMON.SELECT")}
						</Button>
					</span>
				</Tooltip>
			);
		}

		return (
			<Button
				variant={isSelectedVote ? "info" : "secondary"}
				onClick={() => onVoteSelect?.(delegate.address())}
				data-testid={`DelegateRow__toggle-${index}`}
			>
				{isSelectedVote ? t("COMMON.SELECTED") : t("COMMON.SELECT")}
			</Button>
		);
	};

	return (
		<TableRow>
			<TableCell
				variant="start"
				innerClassName={cn("space-x-4 font-bold border border-r-0 border-transparent", rowColor)}
			>
				<Avatar size="lg" address={delegate.address()} noShadow />
				<span>{delegate.username()}</span>
			</TableCell>

			<TableCell
				className="w-24"
				innerClassName={cn("justify-center border-t border-b border-transparent", rowColor)}
			>
				<Link
					data-testid="DelegateRow__address"
					to={delegate.explorerLink()}
					tooltip={t("COMMON.OPEN_IN_EXPLORER")}
					showExternalIcon={false}
					isExternal
				>
					<Icon name="Redirect" />
				</Link>
			</TableCell>

			<TableCell
				variant="end"
				className="w-40"
				innerClassName={cn("justify-end border border-l-0 border-transparent", rowColor)}
			>
				{renderButton()}
			</TableCell>
		</TableRow>
	);
};

DelegateRow.defaultProps = {
	isLoading: false,
	isVoteDisabled: false,
	isVoted: false,
	selectedUnvotes: [],
	selectedVotes: [],
};
