export interface RecipientListItem {
	address: string;
	displayAmount?: string;
	amount?: number;
	exchangeAmount?: number;
	exchangeTicker?: string;
	assetSymbol?: string;
	isEditable?: boolean;
	label?: string;
	listIndex?: number;
	variant?: "condensed";
	alias?: string;
	showAmount?: boolean;
	tooltipDisabled?: string;
	disableButton?: (address: string) => boolean;
	onRemove?: (index: number) => void;
}

export interface RecipientList {
	network?: string;
	assetSymbol?: string;
	isEditable?: boolean;
	recipients?: RecipientListItem[];
	showAmount?: boolean;
	label?: string;
	variant?: "condensed";
	tooltipDisabled?: string;
	disableButton?: (address: string) => boolean;
	onRemove?: (index: number) => void;
}
