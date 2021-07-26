export interface RecipientProperties {
	id: string;
	address: string;
	alias?: string;
	network?: string;
	avatar: string;
	type: string;
}

export interface RecipientListItemProperties {
	recipient: RecipientProperties;
	onAction: (address: string) => void;
}

export interface SearchRecipientProperties {
	title?: string;
	description?: string;
	recipients: RecipientProperties[];
	isOpen: boolean;
	onClose?: () => void;
	onAction: (address: string) => void;
}
