import { Contracts } from "@payvo/profiles";
import { Address } from "app/components/Address";
import { Avatar } from "app/components/Avatar";
import { Circle } from "app/components/Circle";
import { useFormField } from "app/components/Form/useFormField";
import { Icon } from "app/components/Icon";
import { Input } from "app/components/Input";
import { useWalletAlias } from "app/hooks";
import { SearchWallet } from "domains/wallet/components/SearchWallet";
import { SelectedWallet } from "domains/wallet/components/SearchWallet/SearchWallet.models";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type SelectAddressProperties = {
	address?: string;
	wallets: Contracts.IReadWriteWallet[];
	profile: Contracts.IProfile;
	disabled?: boolean;
	isInvalid?: boolean;
	isVerified?: boolean;
	onChange?: (address: string) => void;
} & React.InputHTMLAttributes<any>;

const WalletAvatar = ({ address }: any) => {
	if (!address) {
		return (
			<Circle
				className="bg-theme-secondary-200 border-theme-secondary-200 dark:bg-theme-secondary-700 dark:border-theme-secondary-700"
				size="sm"
				noShadow
			/>
		);
	}
	return <Avatar address={address} size="sm" noShadow />;
};

export const SelectAddress = React.forwardRef<HTMLInputElement, SelectAddressProperties>(
	({ address, wallets, profile, disabled, isInvalid, isVerified, onChange }: SelectAddressProperties, reference) => {
		const [searchWalletIsOpen, setSearchWalletIsOpen] = useState(false);
		const [selectedAddress, setSelectedAddress] = useState(address);

		useEffect(() => setSelectedAddress(address), [address]);

		const fieldContext = useFormField();
		const isInvalidField = fieldContext?.isInvalid || isInvalid;

		const { t } = useTranslation();

		const handleSelectWallet = ({ address }: SelectedWallet) => {
			setSelectedAddress(address);
			setSearchWalletIsOpen(false);
			onChange?.(address);
		};

		const { getWalletAlias } = useWalletAlias();

		const { alias } = useMemo(
			() =>
				getWalletAlias({
					address: selectedAddress,
					profile,
				}),
			[getWalletAlias, profile, selectedAddress],
		);

		return (
			<>
				<button
					data-testid="SelectAddress__wrapper"
					className="relative w-full rounded focus:ring-2 focus:outline-none focus:ring-theme-primary-400"
					type="button"
					onClick={() => setSearchWalletIsOpen(true)}
					disabled={disabled}
				>
					<span className="flex absolute inset-0 items-center px-14 w-full border border-transparent">
						<Address address={selectedAddress} walletName={alias} />
					</span>

					<Input
						data-testid="SelectAddress__input"
						ref={reference}
						value={selectedAddress || ""}
						hideInputValue={true}
						readOnly
						isInvalid={isInvalidField}
						addons={{
							end: {
								content: (
									<div className="flex items-center space-x-3 text-theme-primary-300 dark:text-theme-secondary-600">
										{isVerified && (
											<div className="rounded-full text-theme-success-400 bg-theme-success-100">
												<Icon name="Checkmark" size="lg" />
											</div>
										)}
										<Icon name="User" size="lg" />
									</div>
								),
							},
							start: {
								content: <WalletAvatar address={selectedAddress} />,
							},
						}}
					/>
				</button>

				<SearchWallet
					isOpen={searchWalletIsOpen}
					title={t("PROFILE.MODAL_SELECT_SENDER.TITLE")}
					description={t("PROFILE.MODAL_SELECT_SENDER.DESCRIPTION")}
					disableAction={(wallet: Contracts.IReadWriteWallet) => !wallet.balance()}
					searchPlaceholder={t("PROFILE.MODAL_SELECT_SENDER.SEARCH_PLACEHOLDER")}
					wallets={wallets}
					size="4xl"
					showConvertedValue={false}
					showNetwork={false}
					onSelectWallet={handleSelectWallet}
					onClose={() => setSearchWalletIsOpen(false)}
				/>
			</>
		);
	},
);

SelectAddress.displayName = "SelectAddress";
