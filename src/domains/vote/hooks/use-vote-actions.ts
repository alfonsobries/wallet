import { Contracts } from "@payvo/profiles";
import { useHistory } from "react-router-dom";

interface VoteActionsProperties {
	profile: Contracts.IProfile;
	wallet: Contracts.IReadWriteWallet;
	selectedAddress: string;
	hasWalletId: boolean;
}

export const useVoteActions = ({ profile, wallet, selectedAddress, hasWalletId }: VoteActionsProperties) => {
	const history = useHistory();

	const navigateToSendVote = (unvotes: string[], votes: string[]) => {
		const walletId = hasWalletId ? wallet.id() : profile.wallets().findByAddress(selectedAddress)?.id();

		const parameters = new URLSearchParams();

		if (unvotes?.length > 0) {
			parameters.append("unvotes", unvotes.join(","));
		}

		/* istanbul ignore else */
		if (votes?.length > 0) {
			parameters.append("votes", votes.join(","));
		}

		history.push({
			pathname: `/profiles/${profile.id()}/wallets/${walletId}/send-vote`,
			search: `?${parameters}`,
		});
	};

	return { navigateToSendVote };
};
