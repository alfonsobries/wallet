import { Contracts } from "@payvo/profiles";
import { Networks } from "@payvo/sdk";
import { useEnvironmentContext } from "app/contexts";
import { useCallback } from "react";
import { assertProfile, assertString } from "utils/assertions";

interface Properties {
	address?: string;
	network?: Networks.Network;
	profile?: Contracts.IProfile;
}

interface WalletAliasResult {
	alias: string | undefined;
	isContact: boolean;
	isDelegate: boolean;
	isKnown: boolean;
}

interface HookResult {
	getWalletAlias: (input: Properties) => WalletAliasResult;
}

const useWalletAlias = (): HookResult => {
	const { env } = useEnvironmentContext();

	const getWalletAlias = useCallback(
		({ address, profile, network }: Properties) => {
			try {
				assertString(address);
				assertProfile(profile);
			} catch {
				return {
					alias: undefined,
					isContact: false,
					isDelegate: false,
					isKnown: false,
				};
			}

			const getDelegateUsername = (network?: Networks.Network): string | undefined => {
				if (!network) {
					return undefined;
				}

				try {
					const delegate = env.delegates().findByAddress(network.coin(), network.id(), address);

					return delegate.username();
				} catch {
					return undefined;
				}
			};

			const contact = profile.contacts().findByAddress(address)[0];

			if (contact) {
				return {
					alias: contact.name(),
					isContact: true,
					isDelegate: !!getDelegateUsername(network),
					isKnown: !!profile.wallets().findByAddress(address),
				};
			}

			const wallet = profile.wallets().findByAddress(address);

			if (wallet) {
				return {
					alias: wallet.displayName(),
					isContact: false,
					isDelegate: !!getDelegateUsername(wallet.network()),
					isKnown: true,
				};
			}

			if (network) {
				return {
					alias: getDelegateUsername(network),
					isContact: false,
					isDelegate: true,
					isKnown: false,
				};
			}

			return {
				alias: undefined,
				isContact: false,
				isDelegate: false,
				isKnown: false,
			};
		},
		[env],
	);

	return { getWalletAlias };
};

export { useWalletAlias };

export type { WalletAliasResult };
