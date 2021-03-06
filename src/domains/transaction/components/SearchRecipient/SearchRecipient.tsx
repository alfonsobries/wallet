import { Contracts } from "@payvo/profiles";
import { Networks } from "@payvo/sdk";
import { Address } from "app/components/Address";
import { Avatar } from "app/components/Avatar";
import { Button } from "app/components/Button";
import { HeaderSearchBar } from "app/components/Header/HeaderSearchBar";
import { Modal } from "app/components/Modal";
import { Table, TableCell, TableRow } from "app/components/Table";
import { TableColumn } from "app/components/Table/TableColumn.models";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface Recipient {
	id: string;
	address: string;
	alias?: string;
	network?: string;
	avatar: string;
	type: string;
}

interface RecipientListItemProperties {
	recipient: Recipient;
	onAction: (address: string) => void;
}

const RecipientListItem = ({ recipient, onAction }: RecipientListItemProperties) => {
	const { t } = useTranslation();

	return (
		<TableRow key={recipient.id} border>
			<TableCell variant="start" innerClassName="space-x-4">
				<Avatar size="lg" address={recipient.address} />
				<Address walletName={recipient.alias} address={recipient.address} maxNameChars={16} />
			</TableCell>

			<TableCell>
				<span data-testid="RecipientListItem__type">
					{recipient.type === "wallet" ? t("COMMON.MY_WALLET") : t("COMMON.CONTACT")}
				</span>
			</TableCell>

			<TableCell variant="end" innerClassName="justify-end">
				<Button
					data-testid="RecipientListItem__select-button"
					variant="secondary"
					onClick={() => onAction(recipient.address)}
				>
					{t("COMMON.SELECT")}
				</Button>
			</TableCell>
		</TableRow>
	);
};

interface SearchRecipientProperties {
	title?: string;
	description?: string;
	network?: Networks.Network;
	isOpen: boolean;
	profile: Contracts.IProfile;
	onClose?: () => void;
	onAction: (address: string) => void;
}

export const SearchRecipient = ({
	title,
	description,
	profile,
	isOpen,
	network,
	onClose,
	onAction,
}: SearchRecipientProperties) => {
	const { t } = useTranslation();

	const contacts = profile.contacts().values();
	const profileWallets = profile.wallets().values();

	const columns: TableColumn[] = [
		{
			Header: t("COMMON.WALLET_ADDRESS"),
			accessor: (recipient: Recipient) => recipient.alias,
		},
		{
			Header: t("COMMON.TYPE"),
			accessor: "type",
		},
		{
			Header: (
				<HeaderSearchBar
					placeholder={t("TRANSACTION.MODAL_SEARCH_RECIPIENT.SEARCH_PLACEHOLDER")}
					offsetClassName="top-1/3 -translate-y-16 -translate-x-6"
					noToggleBorder
				/>
			),
			accessor: "search",
			className: "justify-end no-border",
			disableSortBy: true,
		},
	];

	const recipients = useMemo(() => {
		const recipientsList: Recipient[] = [];

		const isNetworkSelected = (addressNetwork: string) => {
			if (!network?.id()) {
				return true;
			}

			return addressNetwork === network?.id();
		};

		for (const wallet of profileWallets) {
			if (!isNetworkSelected(wallet.network().id())) {
				continue;
			}

			recipientsList.push({
				address: wallet.address(),
				alias: wallet.alias(),
				avatar: wallet.avatar(),
				id: wallet.id(),
				network: wallet.network().id(),
				type: "wallet",
			});
		}

		for (const contact of contacts) {
			for (const contactAddress of contact.addresses().values()) {
				if (!isNetworkSelected(contactAddress.network())) {
					continue;
				}

				recipientsList.push({
					address: contactAddress.address(),
					alias: contact.name(),
					avatar: contactAddress.avatar(),
					id: contactAddress.id(),
					network: contactAddress.network(),
					type: "contact",
				});
			}
		}

		return recipientsList;
	}, [profileWallets, contacts, network]);

	return (
		<Modal
			isOpen={isOpen}
			title={title || t("TRANSACTION.MODAL_SEARCH_RECIPIENT.TITLE")}
			description={description || t("TRANSACTION.MODAL_SEARCH_RECIPIENT.DESCRIPTION")}
			size="5xl"
			onClose={onClose}
		>
			<div className="mt-8">
				<Table columns={columns} data={recipients}>
					{(recipient: Recipient) => <RecipientListItem recipient={recipient} onAction={onAction} />}
				</Table>
			</div>
		</Modal>
	);
};
