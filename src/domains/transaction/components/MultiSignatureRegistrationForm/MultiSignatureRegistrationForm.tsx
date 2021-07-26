import { TabPanel, Tabs } from "app/components/Tabs";
import { TransactionDetail, TransactionFee } from "domains/transaction/components/TransactionDetail";
import {
	SendRegistrationComponent,
	SendRegistrationDetailsOptions,
	SendRegistrationForm,
} from "domains/transaction/pages/SendRegistration/SendRegistration.models";
import React from "react";

import { FormStep, ReviewStep } from ".";

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

export const MultiSignatureRegistrationForm: SendRegistrationForm = {
	component: StepsComponent,
	formFields: ["participants", "minParticipants"],
	tabSteps: 2,
	transactionDetails,
};
