import { isEmptyObject, uniq } from "@arkecosystem/utils";
import { Contracts } from "@payvo/profiles";
import { Networks } from "@payvo/sdk";
import { useWalletFilters } from "domains/dashboard/components/FilterWallets";
import { FilterOption } from "domains/vote/components/VotesFilter";
import { useMemo, useState } from "react";

export const useVoteFilters = ({
	profile,
	filter,
	wallet,
	hasWalletId,
}: {
	profile: Contracts.IProfile;
	filter: FilterOption;
	wallet: Contracts.IReadWriteWallet;
	hasWalletId: boolean;
}) => {
	const { defaultConfiguration, useTestNetworks } = useWalletFilters({ profile });
	const walletAddress = hasWalletId ? wallet.address() : "";
	const walletMaxVotes = hasWalletId ? wallet.network().maximumVotesPerWallet() : undefined;

	const [walletsDisplayType, setWalletsDisplayType] = useState(defaultConfiguration.walletsDisplayType);
	const [selectedNetworkIds, setSelectedNetworkIds] = useState(defaultConfiguration.selectedNetworkIds);
	const [voteFilter, setVoteFilter] = useState<FilterOption>(filter);
	const [selectedAddress, setSelectedAddress] = useState(walletAddress);
	const [searchQuery, setSearchQuery] = useState("");
	const [maxVotes, setMaxVotes] = useState(walletMaxVotes);

	const networks = useMemo(() => {
		const networks: Record<string, { network: Networks.Network; isSelected: boolean }> = {};

		for (const wallet of profile.wallets().values()) {
			const networkId = wallet.networkId();

			if (!networks[networkId]) {
				networks[networkId] = {
					isSelected: selectedNetworkIds.includes(networkId),
					network: wallet.network(),
				};
			}
		}

		return Object.values(networks);
	}, [profile, selectedNetworkIds]);

	const isFilterChanged = useMemo(() => {
		if (walletsDisplayType !== defaultConfiguration.walletsDisplayType) {
			return true;
		}

		if (selectedNetworkIds.length < defaultConfiguration.selectedNetworkIds.length) {
			return true;
		}

		return false;
	}, [walletsDisplayType, selectedNetworkIds, defaultConfiguration]);

	const filterProperties = {
		networks,
		onChange: (key: string, value: any) => {
			if (key === "walletsDisplayType") {
				setWalletsDisplayType(value);
			}
			if (key === "selectedNetworkIds") {
				setSelectedNetworkIds(value);
			}
		},
		selectedNetworkIds,
		useTestNetworks,
		walletsDisplayType,
	};

	const walletsByCoin = useMemo(() => {
		const wallets = profile.wallets().allByCoin();

		const usesTestNetworks = profile.settings().get(Contracts.ProfileSetting.UseTestNetworks);
		const usedWallets = usesTestNetworks
			? profile.wallets().values()
			: profile
					.wallets()
					.values()
					.filter((wallet) => wallet.network().isLive());

		const usedCoins = uniq(usedWallets.map((wallet) => wallet.currency()));

		return usedCoins.reduce(
			(coins, coin) => ({
				...coins,
				[coin]: Object.values(wallets[coin]).filter((wallet: Contracts.IReadWriteWallet) => {
					if (!selectedNetworkIds.includes(wallet.network().id())) {
						return false;
					}

					if (walletsDisplayType === "starred") {
						return wallet.isStarred();
					}

					if (walletsDisplayType === "ledger") {
						return wallet.isLedger();
					}

					return wallet;
				}),
			}),
			{} as Record<string, Contracts.IReadWriteWallet[]>,
		);
	}, [profile, selectedNetworkIds, walletsDisplayType]);

	const filteredWalletsByCoin = useMemo(() => {
		if (searchQuery.length === 0) {
			return walletsByCoin;
		}

		return Object.keys(walletsByCoin).reduce(
			(coins, coin) => ({
				...coins,
				[coin]: Object.values(walletsByCoin[coin]).filter(
					(wallet: Contracts.IReadWriteWallet) =>
						wallet.address().toLowerCase().includes(searchQuery.toLowerCase()) ||
						wallet.alias()?.toLowerCase()?.includes(searchQuery.toLowerCase()),
				),
			}),
			{} as Record<string, Contracts.IReadWriteWallet[]>,
		);
	}, [searchQuery, walletsByCoin]);

	const hasEmptyResults = Object.keys(filteredWalletsByCoin).every(
		(coin: string) => filteredWalletsByCoin[coin].length === 0,
	);

	const hasWallets = !isEmptyObject(walletsByCoin);

	return {
		filterProperties,
		filteredWalletsByCoin,
		hasEmptyResults,
		hasWallets,
		isFilterChanged,
		maxVotes,
		networks,
		searchQuery,
		selectedAddress,
		selectedNetworkIds,
		setMaxVotes,
		setSearchQuery,
		setSelectedAddress,
		setVoteFilter,
		useTestNetworks,
		voteFilter,
		walletsByCoin,
		walletsDisplayType,
	};
};
