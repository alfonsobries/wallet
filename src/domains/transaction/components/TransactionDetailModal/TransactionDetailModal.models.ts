import { Contracts, DTO } from "@payvo/profiles";
import { WalletAliasResult } from "app/hooks";

export interface TransactionAliases {
	sender: WalletAliasResult;
	recipients: WalletAliasResult[];
}

export interface TransactionDetailModalProperties {
	isOpen: boolean;
	transactionItem: DTO.ExtendedConfirmedTransactionData;
	profile?: Contracts.IProfile;
	onClose?: any;
}
