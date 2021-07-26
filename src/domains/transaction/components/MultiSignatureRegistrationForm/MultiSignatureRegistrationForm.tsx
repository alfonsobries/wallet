import { TabPanel, Tabs } from "app/components/Tabs";
import { TransactionDetail, TransactionFee } from "domains/transaction/components/TransactionDetail";
import {
	ExtendedSignedTransactionData,
	SendRegistrationComponent,
	SendRegistrationDetailsOptions,
	SendRegistrationForm,
	SendRegistrationSignOptions,
} from "domains/transaction/pages/SendRegistration/SendRegistration.models";
import { handleBroadcastError } from "domains/transaction/utils";
import React from "react";

import { FormStep, ReviewStep } from ".";
import { Participant } from "./components/AddParticipant/AddParticipant";

const StepsComponent = ({ activeTab, fees, wallet, profile }: SendRegistrationComponent) => (
	<Tabs activeId={activeTab}>
		<TabPanel tabId={1}>
			<FormStep fees={fees} wallet={wallet} profile={profile} />
		</TabPanel>
		<TabPanel tabId={2}>
			<ReviewStep wallet={wallet} />
		</TabPanel>
	</Tabs>
);

const transactionDetails = ({ transaction, translations, wallet }: SendRegistrationDetailsOptions) => (
	<>
		<TransactionDetail label={translations("TRANSACTION.MULTISIGNATURE.GENERATED_ADDRESS")}>
			{transaction.generatedAddress}
		</TransactionDetail>

		<TransactionFee currency={wallet.currency()} value={transaction.fee()} paddingPosition="top" />
	</>
);

StepsComponent.displayName = "MultiSignatureRegistrationForm";
transactionDetails.displayName = "MultiSignatureRegistrationFormTransactionDetails";

const signTransaction = async ({ env, form, profile, signatory }: SendRegistrationSignOptions) => {
	const { clearErrors, getValues } = form;

	clearErrors("mnemonic");
	const { fee, minParticipants, participants, senderAddress } = getValues();
	const senderWallet = profile.wallets().findByAddress(senderAddress);

	const publicKeys = (participants as Participant[]).map((item) => item.publicKey);

	const uuid = await senderWallet!.transaction().signMultiSignature({
		data: {
			min: +minParticipants,
			publicKeys: [...publicKeys],
			senderPublicKey: senderWallet!.publicKey(),
		},
		fee: +fee,
		nonce: senderWallet!.nonce().plus(1).toString(),
		signatory: await senderWallet!
			.coin()
			.signatory()
			.multiSignature(+minParticipants, publicKeys),
	});

	const { accepted, rejected, errors } = await senderWallet!.transaction().broadcast(uuid);

	handleBroadcastError({ accepted, errors, rejected });

	const transactionId = accepted[0];

	// Need to sync before too to make sure we have all transactions from the server.
	await senderWallet!.transaction().sync();
	await senderWallet!.transaction().addSignature(transactionId, signatory);

	await senderWallet!.transaction().sync();

	await env.persist();

	const transaction: ExtendedSignedTransactionData = senderWallet!.transaction().transaction(transactionId);

	try {
		transaction.generatedAddress = (
			await senderWallet!.coin().address().fromMultiSignature(minParticipants, publicKeys)
		).address;
	} catch {
		// We are using a coin that doesn't support multi-signature address derivation.
	}

	return transaction;
};

export const MultiSignatureRegistrationForm: SendRegistrationForm = {
	component: StepsComponent,
	formFields: ["participants", "minParticipants"],
	signTransaction,
	tabSteps: 2,

	transactionDetails,
};
