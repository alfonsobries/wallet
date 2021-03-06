import { Contracts, Environment } from "@payvo/profiles";

interface ProfileExportOptions {
	excludeEmptyWallets: boolean;
	excludeLedgerWallets: boolean;
}

export const useProfileExport = ({ profile, env }: { profile: Contracts.IProfile; env: Environment }) => {
	const formatExportData = (filters: ProfileExportOptions) => {
		let password;

		if (profile.usesPassword()) {
			password = profile.password().get();
		}

		return env.profiles().export(
			profile,
			{
				...filters,
				addNetworkInformation: true,
				saveGeneralSettings: true,
			},
			password,
		);
	};

	return { formatExportData };
};
