import { Contracts } from "@payvo/profiles";
import { Enums } from "@payvo/sdk";
import { DropdownOptionGroup } from "app/components/Dropdown";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const useWalletOptions = (wallet: Contracts.IReadWriteWallet) => {
	const { t } = useTranslation();

	const isMultiSignature = useMemo((): boolean => {
		try {
			return wallet.isMultiSignature();
		} catch {
			return false;
		}
	}, [wallet]);

	const primaryOptions: DropdownOptionGroup = {
		key: "primary",
		options: [
			{
				label: t("WALLETS.PAGE_WALLET_DETAILS.OPTIONS.WALLET_NAME"),
				value: "wallet-name",
			},
			{
				label: t("WALLETS.PAGE_WALLET_DETAILS.OPTIONS.RECEIVE_FUNDS"),
				secondaryLabel: t("WALLETS.PAGE_WALLET_DETAILS.OPTIONS.RECEIVE_FUNDS_QR"),
				value: "receive-funds",
			},
		],
		title: t("WALLETS.PAGE_WALLET_DETAILS.PRIMARY_OPTIONS"),
	};

	const registrationOptions: DropdownOptionGroup = {
		key: "registrations",
		options: [],
		title: t("WALLETS.PAGE_WALLET_DETAILS.REGISTRATION_OPTIONS"),
	};

	if (
		wallet.balance() > 0 &&
		!wallet.isLedger() &&
		!isMultiSignature &&
		wallet.hasBeenFullyRestored() &&
		wallet.hasSyncedWithNetwork()
	) {
		if (
			wallet.network().allows(Enums.FeatureFlag.TransactionDelegateRegistration) &&
			!wallet.isDelegate() &&
			!wallet.isResignedDelegate()
		) {
			registrationOptions.options.push({
				label: t("WALLETS.PAGE_WALLET_DETAILS.OPTIONS.REGISTER_DELEGATE"),
				value: "delegate-registration",
			});
		}

		if (
			wallet.network().allows(Enums.FeatureFlag.TransactionDelegateResignation) &&
			wallet.isDelegate() &&
			!wallet.isResignedDelegate()
		) {
			registrationOptions.options.push({
				label: t("WALLETS.PAGE_WALLET_DETAILS.OPTIONS.RESIGN_DELEGATE"),
				value: "delegate-resignation",
			});
		}

		if (wallet.network().allows(Enums.FeatureFlag.TransactionSecondSignature) && !wallet.isSecondSignature()) {
			registrationOptions.options.push({
				label: t("WALLETS.PAGE_WALLET_DETAILS.OPTIONS.SECOND_SIGNATURE"),
				value: "second-signature",
			});
		}
	}

	if (
		wallet.balance() > 0 &&
		wallet.hasBeenFullyRestored() &&
		wallet.hasSyncedWithNetwork() &&
		!isMultiSignature &&
		wallet.network().allows(Enums.FeatureFlag.TransactionMultiSignature)
	) {
		registrationOptions.options.push({
			label: t("WALLETS.PAGE_WALLET_DETAILS.OPTIONS.MULTISIGNATURE"),
			value: "multi-signature",
		});
	}

	const additionalOptions: DropdownOptionGroup = {
		key: "additional",
		options: [],
		title: t("WALLETS.PAGE_WALLET_DETAILS.ADDITIONAL_OPTIONS"),
	};

	if (!isMultiSignature && wallet.network().allows(Enums.FeatureFlag.MessageSign)) {
		additionalOptions.options.push({
			label: t("WALLETS.PAGE_WALLET_DETAILS.OPTIONS.SIGN_MESSAGE"),
			value: "sign-message",
		});
	}

	if (!isMultiSignature && wallet.network().allows(Enums.FeatureFlag.MessageVerify)) {
		additionalOptions.options.push({
			label: t("WALLETS.PAGE_WALLET_DETAILS.OPTIONS.VERIFY_MESSAGE"),
			value: "verify-message",
		});
	}

	if (
		wallet.balance() > 0 &&
		wallet.network().allows(Enums.FeatureFlag.TransactionIpfs) &&
		wallet.hasBeenFullyRestored() &&
		wallet.hasSyncedWithNetwork()
	) {
		additionalOptions.options.push({
			label: t("WALLETS.PAGE_WALLET_DETAILS.OPTIONS.STORE_HASH"),
			value: "store-hash",
		});
	}

	const secondaryOptions = {
		hasDivider: true,
		key: "secondary",
		options: [
			{
				icon: "OpenExplorer",
				iconPosition: "start",
				label: t("COMMON.OPEN_IN_EXPLORER"),
				value: "open-explorer",
			},
			{
				icon: "Trash",
				iconPosition: "start",
				label: t("WALLETS.PAGE_WALLET_DETAILS.OPTIONS.DELETE"),
				value: "delete-wallet",
			},
		],
	};

	return useMemo(
		() => ({
			additionalOptions,
			primaryOptions,
			registrationOptions,
			secondaryOptions,
		}),
		[wallet], // eslint-disable-line react-hooks/exhaustive-deps
	);
};
