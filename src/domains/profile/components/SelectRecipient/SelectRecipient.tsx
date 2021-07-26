import { Contracts } from "@payvo/profiles";
import { Networks } from "@payvo/sdk";
import { Address } from "app/components/Address";
import { Avatar } from "app/components/Avatar";
import { Circle } from "app/components/Circle";
import { useFormField } from "app/components/Form/useFormField";
import { Icon } from "app/components/Icon";
import { Select } from "app/components/SelectDropdown";
import { TruncateEnd } from "app/components/TruncateEnd";
import { useWalletAlias } from "app/hooks/use-wallet-alias";
import cn from "classnames";
import { useProfileAddresses } from "domains/profile/hooks/use-profile-addresses";
import { SearchRecipient } from "domains/transaction/components/SearchRecipient";
import React, { useEffect, useMemo, useState } from "react";

type SelectRecipientProperties = {
	network?: Networks.Network;
	address?: string;
	profile: Contracts.IProfile;
	disabled?: boolean;
	isInvalid?: boolean;
	contactSearchTitle?: string;
	contactSearchDescription?: string;
	placeholder?: string;
	onChange?: (address: string) => void;
} & Omit<React.InputHTMLAttributes<any>, "onChange">;

const ProfileAvatar = ({ address }: any) => {
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

const OptionLabel = ({ option, profile }: { option: any; profile: Contracts.IProfile }) => {
	const address = option.value;

	const { getWalletAlias } = useWalletAlias();

	const { alias } = useMemo(
		() =>
			getWalletAlias({
				address,
				profile,
			}),
		[address, getWalletAlias, profile],
	);

	return (
		<div className="flex items-center space-x-2 whitespace-nowrap">
			<Avatar size="sm" address={address} className="flex-shrink-0" noShadow />
			<Address
				address={address}
				walletName={alias}
				addressClass={cn({ "text-theme-primary-600": !alias && option.isSelected })}
				walletNameClass={cn({ "text-theme-primary-600": option.isSelected })}
			/>
		</div>
	);
};

export const SelectRecipient = React.forwardRef<HTMLInputElement, SelectRecipientProperties>(
	(
		{ address, profile, disabled, isInvalid, network, placeholder, onChange }: SelectRecipientProperties,
		reference,
	) => {
		const [isRecipientSearchOpen, setIsRecipientSearchOpen] = useState(false);
		const [selectedAddress, setSelectedAddress] = useState(address);
		const fieldContext = useFormField();

		const { getWalletAlias } = useWalletAlias();
		const { alias: selectedWalletAlias } = getWalletAlias({
			address: selectedAddress,
			network,
			profile,
		});

		const isInvalidValue = isInvalid || fieldContext?.isInvalid;

		// Modify the address from parent component
		useEffect(() => {
			if (address === selectedAddress) {
				return;
			}

			setSelectedAddress(address);
		}, [address, setSelectedAddress]); // eslint-disable-line react-hooks/exhaustive-deps

		const { allAddresses } = useProfileAddresses({ network, profile });
		const recipientAddresses = allAddresses.map(({ address }) => ({
			label: address,
			value: address,
		}));

		const handleSelectAddress = (changedAddress: string) => {
			if (selectedAddress === changedAddress) {
				return;
			}

			setSelectedAddress(changedAddress);
			setIsRecipientSearchOpen(false);
			onChange?.(changedAddress);
		};

		const openRecipients = () => {
			if (disabled) {
				return;
			}

			setIsRecipientSearchOpen(true);
		};

		const onInputChange = (changedAddress: string) => {
			if (selectedAddress === changedAddress) {
				return;
			}

			setSelectedAddress(changedAddress);
			onChange?.(changedAddress);
		};

		return (
			<div>
				<div data-testid="SelectRecipient__wrapper" className="flex relative items-center w-full text-left">
					<Select
						showCaret={false}
						isInvalid={isInvalidValue}
						disabled={disabled}
						defaultValue={selectedAddress}
						placeholder={placeholder}
						ref={reference}
						options={recipientAddresses}
						allowFreeInput={true}
						onChange={(option: any) => onInputChange(option.value)}
						addons={{
							end: {
								content: (
									<div
										data-testid="SelectRecipient__select-recipient"
										className="flex items-center cursor-pointer"
										onClick={openRecipients}
									>
										<Icon name="User" size="lg" />
									</div>
								),
							},
							start: {
								content: (
									<div className="flex items-center">
										<ProfileAvatar address={selectedAddress} />
										{!!selectedWalletAlias && (
											<TruncateEnd
												className="font-semibold ml-2"
												text={selectedWalletAlias}
												showTooltip
											/>
										)}
									</div>
								),
							},
						}}
						renderLabel={(option) => <OptionLabel option={option} profile={profile} />}
					/>
				</div>

				<SearchRecipient
					network={network}
					isOpen={isRecipientSearchOpen}
					profile={profile}
					onAction={(address: string) => handleSelectAddress(address)}
					onClose={() => setIsRecipientSearchOpen(false)}
				/>
			</div>
		);
	},
);

SelectRecipient.displayName = "SelectRecipient";
