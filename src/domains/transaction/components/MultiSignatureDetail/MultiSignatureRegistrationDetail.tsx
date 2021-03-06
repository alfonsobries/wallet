import { DTO } from "@payvo/profiles";
import { Address } from "app/components/Address";
import { Modal } from "app/components/Modal";
import {
	TransactionConfirmations,
	TransactionDetail,
	TransactionExplorerLink,
	TransactionFee,
	TransactionSender,
	TransactionTimestamp,
} from "domains/transaction/components/TransactionDetail";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface MultisignatureRegistrationDetailProperties {
	isOpen: boolean;
	transaction: DTO.ExtendedConfirmedTransactionData;
	onClose?: () => void;
}

export const MultiSignatureRegistrationDetail = ({
	isOpen,
	transaction,
	onClose,
}: MultisignatureRegistrationDetailProperties) => {
	const { t } = useTranslation();

	const wallet = transaction.wallet();
	const [participants, setParticipants] = useState<string[]>([]);
	const [generatedAddress, setGeneratedAddress] = useState<string | undefined>(undefined);

	useEffect(() => {
		const fetchData = async () => {
			const addresses: string[] = [];
			for (const publicKey of transaction.publicKeys()) {
				addresses.push((await wallet.coin().address().fromPublicKey(publicKey)).address);
			}

			const { address } = await wallet
				.coin()
				.address()
				.fromMultiSignature(transaction.min(), transaction.publicKeys());

			setGeneratedAddress(address);
			setParticipants(addresses);
		};

		fetchData();
	}, [wallet, transaction]);

	return (
		<Modal title={t("TRANSACTION.MODAL_MULTISIGNATURE_DETAIL.STEP_1.TITLE")} isOpen={isOpen} onClose={onClose}>
			<TransactionSender address={transaction.sender()} alias={wallet.alias()} border={false} />

			<TransactionFee currency={wallet.currency()} value={transaction.fee()} />

			<TransactionTimestamp timestamp={transaction.timestamp()!} />

			<TransactionConfirmations transaction={transaction} />

			<TransactionDetail label={t("TRANSACTION.MULTISIGNATURE.PARTICIPANTS")}>
				<div className="flex flex-col space-y-2">
					{participants.map((address) => (
						<Address key={address} address={address} />
					))}
				</div>
			</TransactionDetail>

			<TransactionDetail label={t("TRANSACTION.MULTISIGNATURE.MIN_SIGNATURES")}>
				{transaction.min()} / {transaction.publicKeys().length}
			</TransactionDetail>

			<TransactionDetail label={t("TRANSACTION.MULTISIGNATURE.GENERATED_ADDRESS")}>
				{generatedAddress}
			</TransactionDetail>

			<TransactionExplorerLink transaction={transaction} />
		</Modal>
	);
};

MultiSignatureRegistrationDetail.defaultProps = {
	isOpen: false,
};

MultiSignatureRegistrationDetail.displayName = "MultiSignatureRegistrationDetail";
