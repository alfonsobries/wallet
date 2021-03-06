import { Contracts } from "@payvo/profiles";
import { Address } from "app/components/Address";
import { Avatar } from "app/components/Avatar";
import React from "react";

interface VoteListProperties {
	votes?: Contracts.IReadOnlyWallet[];
}

export const VoteList = ({ votes }: VoteListProperties) => (
	<div className="-my-2">
		{votes?.map((vote: Contracts.IReadOnlyWallet, index: number) => (
			<div
				key={index}
				className="border-b border-dashed last:border-b-0 border-theme-secondary-300 dark:border-theme-secondary-800"
			>
				<div className="flex items-center py-4 space-x-4">
					<Avatar size="sm" address={vote.address()} />
					<Address address={vote.address()} walletName={vote.username()} />
				</div>
			</div>
		))}
	</div>
);

VoteList.defaultProps = {
	votes: [],
};
