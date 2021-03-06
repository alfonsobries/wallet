import { DTO } from "@payvo/profiles";
import { Networks } from "@payvo/sdk";
import { Form } from "app/components/Form";
import { Page, Section } from "app/components/Layout";
import { StepIndicator } from "app/components/StepIndicator";
import { StepNavigation } from "app/components/StepNavigation";
import { TabPanel, Tabs } from "app/components/Tabs";
import { useEnvironmentContext, useLedgerContext } from "app/contexts";
import { useActiveProfile, useActiveWallet, useFees, usePrevious } from "app/hooks";
import { AuthenticationStep } from "domains/transaction/components/AuthenticationStep";
import { DelegateRegistrationForm } from "domains/transaction/components/DelegateRegistrationForm";
import { ErrorStep } from "domains/transaction/components/ErrorStep";
import { FeeWarning } from "domains/transaction/components/FeeWarning";
import { MultiSignatureRegistrationForm } from "domains/transaction/components/MultiSignatureRegistrationForm";
import { SecondSignatureRegistrationForm } from "domains/transaction/components/SecondSignatureRegistrationForm";
import { useFeeConfirmation, useMultiSignatureRegistration, useWalletSignatory } from "domains/transaction/hooks";
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";

import { SummaryStep } from ".";
import { SendRegistrationForm } from "./SendRegistration.models";

export const SendRegistration = () => {
	const history = useHistory();

	const [activeTab, setActiveTab] = useState(1);
	const [transaction, setTransaction] = useState((null as unknown) as DTO.ExtendedSignedTransactionData);
	const [registrationForm, setRegistrationForm] = useState<SendRegistrationForm>();
	const [errorMessage, setErrorMessage] = useState<string | undefined>();

	const { registrationType } = useParams();

	const { env } = useEnvironmentContext();
	const activeProfile = useActiveProfile();
	const activeWallet = useActiveWallet();
	const { sign } = useWalletSignatory(activeWallet);
	const { sendMultiSignature, abortReference } = useMultiSignatureRegistration();

	const { findByType } = useFees(activeProfile);
	const { hasDeviceAvailable, isConnected, connect, transport } = useLedgerContext();

	const form = useForm({ mode: "onChange" });

	const { formState, register, setValue, trigger, watch, getValues } = form;
	const { isSubmitting, isValid } = formState;

	const { fee, fees } = watch();

	const previousFee = usePrevious(fee);

	useLayoutEffect(() => {
		if (fee && previousFee === undefined) {
			trigger("fee");
		}
	}, [fee, previousFee, trigger]);

	const stepCount = registrationForm ? registrationForm.tabSteps + 2 : 1;

	const setFeesByRegistrationType = useCallback(
		async (type: string) => {
			const fees = await findByType(activeWallet.coinId(), activeWallet.networkId(), type);

			setValue("fees", fees);
			setValue("fee", fees?.avg);
		},
		[setValue, activeWallet, findByType],
	);

	useEffect(() => {
		register("fee");
		register("fees");
		register("inputFeeSettings");

		register("network", { required: true });
		register("senderAddress", { required: true });

		register("suppressWarning");
	}, [register]);

	const {
		dismissFeeWarning,
		feeWarningVariant,
		requireFeeConfirmation,
		showFeeWarning,
		setShowFeeWarning,
	} = useFeeConfirmation(fee, fees);

	useEffect(() => {
		setValue("senderAddress", activeWallet.address(), { shouldDirty: true, shouldValidate: true });

		const network = env
			.availableNetworks()
			.find(
				(network: Networks.Network) =>
					network.coin() === activeWallet.coinId() && network.id() === activeWallet.networkId(),
			);
		setValue("network", network, { shouldDirty: true, shouldValidate: true });
	}, [activeWallet, env, setValue]);

	useLayoutEffect(() => {
		setFeesByRegistrationType(registrationType);

		switch (registrationType) {
			case "secondSignature": {
				return setRegistrationForm(SecondSignatureRegistrationForm);
			}
			case "multiSignature": {
				return setRegistrationForm(MultiSignatureRegistrationForm);
			}
			default: {
				return setRegistrationForm(DelegateRegistrationForm);
			}
		}
	}, [registrationType, setFeesByRegistrationType]);

	const handleSubmit = async () => {
		try {
			const {
				mnemonic,
				secondMnemonic,
				encryptionPassword,
				wif,
				privateKey,
				secret,
				participants,
				minParticipants,
				fee,
			} = getValues();

			if (activeWallet.isLedger()) {
				await connect(activeProfile, activeWallet.coinId(), activeWallet.networkId());
				await activeWallet.ledger().connect(transport);
			}

			const signatory = await sign({
				encryptionPassword,
				mnemonic,
				privateKey,
				/* istanbul ignore next */
				secondMnemonic: registrationType === "secondSignature" ? undefined : secondMnemonic,
				secret,
				wif,
			});

			if (registrationType === "multiSignature") {
				const transaction = await sendMultiSignature({
					fee,
					minParticipants,
					participants,
					signatory,
					wallet: activeWallet,
				});

				await env.persist();
				setTransaction(transaction);
				setActiveTab(stepCount);
				return;
			}

			const transaction = await registrationForm!.signTransaction({
				env,
				form,
				profile: activeProfile,
				signatory,
			});

			setTransaction(transaction);
			handleNext();
		} catch (error) {
			setErrorMessage(JSON.stringify({ message: error.message, type: error.name }));
			setActiveTab(10);
		}
	};

	const handleBack = () => {
		// Abort any existing listener
		abortReference.current.abort();

		if (activeTab === 1) {
			return history.push(`/profiles/${activeProfile.id()}/wallets/${activeWallet.id()}`);
		}

		setActiveTab(activeTab - 1);
	};

	const handleNext = (suppressWarning?: boolean) => {
		abortReference.current = new AbortController();

		const newIndex = activeTab + 1;
		const isAuthenticationStep = newIndex === stepCount - 1;

		if (newIndex === stepCount - 1 && requireFeeConfirmation && !suppressWarning) {
			return setShowFeeWarning(true);
		}

		// Skip authentication step
		if (isAuthenticationStep && activeWallet.isLedger()) {
			handleSubmit();
		}

		setActiveTab(newIndex);
	};

	const hideStepNavigation = activeTab === 10 || (activeTab === stepCount - 1 && activeWallet.isLedger());

	return (
		<Page profile={activeProfile}>
			<Section className="flex-1">
				<Form
					data-testid="Registration__form"
					className="mx-auto max-w-xl"
					context={form}
					onSubmit={handleSubmit}
				>
					<Tabs activeId={activeTab}>
						<StepIndicator size={stepCount} activeIndex={activeTab} />

						<div className="mt-8">
							<TabPanel tabId={10}>
								<ErrorStep
									onBack={() =>
										history.push(`/profiles/${activeProfile.id()}/wallets/${activeWallet.id()}`)
									}
									isRepeatDisabled={isSubmitting}
									onRepeat={form.handleSubmit(handleSubmit)}
									errorMessage={errorMessage}
								/>
							</TabPanel>

							{registrationForm && (
								<>
									<registrationForm.component
										activeTab={activeTab}
										fees={fees}
										wallet={activeWallet}
										profile={activeProfile}
									/>

									<TabPanel tabId={stepCount - 1}>
										<AuthenticationStep
											wallet={activeWallet}
											ledgerIsAwaitingDevice={!hasDeviceAvailable}
											ledgerIsAwaitingApp={!isConnected}
										/>
									</TabPanel>

									<TabPanel tabId={stepCount}>
										<SummaryStep
											transaction={transaction}
											registrationForm={registrationForm}
											senderWallet={activeWallet}
										/>
									</TabPanel>
								</>
							)}

							{!hideStepNavigation && (
								<StepNavigation
									onBackClick={handleBack}
									onBackToWalletClick={() =>
										history.push(`/profiles/${activeProfile.id()}/wallets/${activeWallet.id()}`)
									}
									onContinueClick={() => handleNext()}
									isLoading={isSubmitting}
									isNextDisabled={!isValid}
									size={stepCount}
									activeIndex={activeTab}
								/>
							)}
						</div>
					</Tabs>

					<FeeWarning
						isOpen={showFeeWarning}
						variant={feeWarningVariant}
						onCancel={(suppressWarning: boolean) =>
							dismissFeeWarning(() => setActiveTab(1), suppressWarning)
						}
						onConfirm={(suppressWarning: boolean) =>
							dismissFeeWarning(() => handleNext(true), suppressWarning)
						}
					/>
				</Form>
			</Section>
		</Page>
	);
};
