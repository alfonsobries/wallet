import { Contracts, DTO } from "@payvo/profiles";
import { Button } from "app/components/Button";
import { Form } from "app/components/Form";
import { Modal } from "app/components/Modal";
import { TabPanel, Tabs } from "app/components/Tabs";
import { useEnvironmentContext, useLedgerContext } from "app/contexts";
import { toasts } from "app/services";
import { ErrorStep } from "domains/transaction/components/ErrorStep";
import { SignInput, useMultiSignatureRegistration, useWalletSignatory } from "domains/transaction/hooks";
import React, { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { AuthenticationStep } from "../AuthenticationStep";
import { SentStep } from "./SentStep";
import { SummaryStep } from "./SummaryStep";

interface MultiSignatureDetailProperties {
	isOpen: boolean;
	profile: Contracts.IProfile;
	wallet: Contracts.IReadWriteWallet;
	transaction: DTO.ExtendedSignedTransactionData;
	onClose?: () => void;
}

const Paginator = (properties: {
	onCancel?: () => void;
	onSign?: () => void;
	onBack?: () => void;
	onContinue?: () => void;
	isEnabled?: boolean;
	isLoading?: boolean;
	activeStep: number;
}) => {
	const { t } = useTranslation();
	return (
		<div className="flex justify-end mt-8 space-x-3">
			{properties.activeStep === 1 && (
				<>
					<Button data-testid="Paginator__cancel" variant="secondary" onClick={properties.onCancel}>
						{t("COMMON.CANCEL")}
					</Button>

					<Button data-testid="Paginator__sign" onClick={properties.onSign}>
						{t("COMMON.SIGN")}
					</Button>
				</>
			)}

			{properties.activeStep === 2 && (
				<>
					<Button data-testid="Paginator__back" variant="secondary" onClick={properties.onBack}>
						{t("COMMON.BACK")}
					</Button>

					<Button
						disabled={!properties.isEnabled || properties.isLoading}
						data-testid="Paginator__continue"
						isLoading={properties.isLoading}
						onClick={properties.onContinue}
					>
						{t("COMMON.CONTINUE")}
					</Button>
				</>
			)}
		</div>
	);
};

export const MultiSignatureDetail = ({
	isOpen,
	wallet,
	profile,
	transaction,
	onClose,
}: MultiSignatureDetailProperties) => {
	const [errorMessage, setErrorMessage] = useState<string | undefined>();

	const { t } = useTranslation();
	const { persist } = useEnvironmentContext();
	const { hasDeviceAvailable, isConnected, connect, transport } = useLedgerContext();

	const form = useForm({ mode: "onChange" });
	const { handleSubmit, formState } = form;
	const { isValid, isSubmitting } = formState;

	const [activeStep, setActiveStep] = useState(1);

	const { sign } = useWalletSignatory(wallet);
	const { addSignature } = useMultiSignatureRegistration();

	const canBeBroadascated =
		wallet.transaction().canBeBroadcasted(transaction.id()) &&
		!wallet.transaction().isAwaitingConfirmation(transaction.id());

	const canBeSigned = useMemo(() => {
		try {
			return wallet.transaction().canBeSigned(transaction.id());
		} catch {
			return false;
		}
	}, [wallet, transaction]);

	const broadcast = useCallback(async () => {
		try {
			if (wallet.transaction().canBeBroadcasted(transaction.id())) {
				await wallet.transaction().broadcast(transaction.id());
			}

			await persist();
			setActiveStep(3);
		} catch (error) {
			setErrorMessage(JSON.stringify({ message: error.message, type: error.name }));
			setActiveStep(10);
		}
	}, [wallet, transaction, persist]);

	const sendSignature = useCallback(
		async ({ encryptionPassword, mnemonic, privateKey, secondMnemonic, secret, wif }: SignInput) => {
			try {
				const signatory = await sign({
					encryptionPassword,
					mnemonic,
					privateKey,
					secondMnemonic,
					secret,
					wif,
				});

				await addSignature({ signatory, transactionId: transaction.id(), wallet });
				await wallet.transaction().sync();
				await broadcast();
			} catch {
				toasts.error(t("TRANSACTION.MULTISIGNATURE.ERROR.FAILED_TO_SIGN"));
			}
		},
		[transaction, wallet, broadcast, t, sign, addSignature],
	);

	const handleSign = async () => {
		setActiveStep(2);

		if (wallet.isLedger()) {
			await connect(profile, wallet.coinId(), wallet.networkId());
			await wallet.ledger().connect(transport);
			handleSubmit((data: any) => sendSignature(data))();
		}
	};

	return (
		<Modal title={""} isOpen={isOpen} onClose={onClose}>
			<Form context={form} onSubmit={broadcast}>
				<Tabs activeId={activeStep}>
					<TabPanel tabId={1}>
						<SummaryStep wallet={wallet} transaction={transaction} />
					</TabPanel>

					<TabPanel tabId={2}>
						<AuthenticationStep
							wallet={wallet}
							ledgerIsAwaitingDevice={!hasDeviceAvailable}
							ledgerIsAwaitingApp={!isConnected}
						/>
					</TabPanel>

					<TabPanel tabId={3}>
						<SentStep transaction={transaction} wallet={wallet} />
					</TabPanel>

					<TabPanel tabId={10}>
						<ErrorStep
							onBack={onClose}
							isRepeatDisabled={isSubmitting}
							onRepeat={broadcast}
							errorMessage={errorMessage}
						/>
					</TabPanel>

					{canBeBroadascated && !canBeSigned && activeStep === 1 && (
						<div className="flex justify-center mt-8 space-x-2">
							<Button
								disabled={isSubmitting}
								type="submit"
								isLoading={isSubmitting}
								data-testid="MultiSignatureDetail__broadcast"
							>
								{t("COMMON.SEND")}
							</Button>
						</div>
					)}

					{canBeSigned && (
						<Paginator
							activeStep={activeStep}
							onCancel={onClose}
							onSign={handleSign}
							onBack={() => setActiveStep(1)}
							onContinue={handleSubmit((data: any) => sendSignature(data))}
							isLoading={isSubmitting}
							isEnabled={isValid}
						/>
					)}
				</Tabs>
			</Form>
		</Modal>
	);
};

MultiSignatureDetail.defaultProps = {
	isOpen: false,
};

MultiSignatureDetail.displayName = "MultiSignatureDetail";
