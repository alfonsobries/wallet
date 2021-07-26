import { Contracts, DTO } from "@payvo/profiles";
import { Networks, Services } from "@payvo/sdk";
import { Form } from "app/components/Form";
import { Page, Section } from "app/components/Layout";
import { StepIndicator } from "app/components/StepIndicator";
import { StepNavigation } from "app/components/StepNavigation";
import { TabPanel, Tabs } from "app/components/Tabs";
import { useEnvironmentContext, useLedgerContext } from "app/contexts";
import { useActiveProfile, useActiveWallet, useQueryParams, useValidation } from "app/hooks";
import { AuthenticationStep } from "domains/transaction/components/AuthenticationStep";
import { ConfirmSendTransaction } from "domains/transaction/components/ConfirmSendTransaction";
import { ErrorStep } from "domains/transaction/components/ErrorStep";
import { FeeWarning } from "domains/transaction/components/FeeWarning";
import {
	useFeeConfirmation,
	useTransaction,
	useTransactionBuilder,
	useWalletSignatory,
} from "domains/transaction/hooks";
import { handleBroadcastError } from "domains/transaction/utils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";
import { assertWallet } from "utils/assertions";
import { lowerCaseEquals } from "utils/equals";

import { FormStep } from "./FormStep";
import { TransferLedgerReview } from "./LedgerReview";
import { NetworkStep } from "./NetworkStep";
import { ReviewStep } from "./ReviewStep";
import { SummaryStep } from "./SummaryStep";

export const SendTransfer = () => {
	const history = useHistory();
	const profile = useActiveProfile();
	const { walletId: hasWalletId } = useParams();
	const [errorMessage, setErrorMessage] = useState<string | undefined>();

	const queryParameters = useQueryParams();

	const shouldResetForm = queryParameters.get("reset") === "1";

	const deepLinkParameters = useMemo(() => {
		const result: Record<string, string> = {};
		for (const [key, value] of queryParameters.entries()) {
			if (key !== "reset") {
				result[key] = value;
			}
		}
		return result;
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const hasDeepLinkParameters = Object.keys(deepLinkParameters).length > 0;

	const showNetworkStep = !hasDeepLinkParameters && !hasWalletId;
	const firstTabIndex = showNetworkStep ? 0 : 1;

	const [activeTab, setActiveTab] = useState(firstTabIndex);
	const [unconfirmedTransactions, setUnconfirmedTransactions] = useState<DTO.ExtendedConfirmedTransactionData[]>([]);
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [transaction, setTransaction] = useState<DTO.ExtendedSignedTransactionData | undefined>(undefined);

	const { persist } = useEnvironmentContext();
	const activeProfile = useActiveProfile();
	const activeWallet = useActiveWallet();

	const [wallet, setWallet] = useState<Contracts.IReadWriteWallet | undefined>(
		hasWalletId ? activeWallet : undefined,
	);

	const networks = useMemo(() => {
		const results: Record<string, Networks.Network> = {};
		for (const wallet of profile.wallets().values()) {
			results[wallet.networkId()] = wallet.network();
		}
		return Object.values(results);
	}, [profile]);

	const defaultValues = {
		amount: 0,
		recipients: [],
		remainingBalance: wallet?.balance?.(),
	};

	const form = useForm<any>({
		defaultValues,
		mode: "onChange",
	});

	const { clearErrors, formState, getValues, register, setValue, handleSubmit, watch, reset } = form;
	const { isValid, isSubmitting } = formState;

	const { senderAddress, fees, fee, remainingBalance, amount, isSendAllSelected, network } = watch();
	const { sendTransfer, common } = useValidation();

	const { hasDeviceAvailable, isConnected, transport, connect } = useLedgerContext();

	const [lastEstimatedExpiration, setLastEstimatedExpiration] = useState<number | undefined>();
	const abortReference = useRef(new AbortController());
	const transactionBuilder = useTransactionBuilder();
	const { sign } = useWalletSignatory(wallet!);
	const { fetchWalletUnconfirmedTransactions } = useTransaction();

	useEffect(() => {
		if (shouldResetForm) {
			setActiveTab(firstTabIndex);

			const resetValues = window.setTimeout(() => {
				reset({ ...defaultValues, network });

				setErrorMessage(undefined);
				setUnconfirmedTransactions([]);
				setTransaction(undefined);
				setLastEstimatedExpiration(undefined);
				setWallet(undefined);

				// remove all query params
				history.replace(history.location.pathname);
			});

			return () => {
				window.clearTimeout(resetValues);
			};
		}
	}, [defaultValues, firstTabIndex, history, network, reset, shouldResetForm]);

	useEffect(() => {
		register("remainingBalance");
		register("network", sendTransfer.network());
		register("recipients", sendTransfer.recipients());
		register("senderAddress", sendTransfer.senderAddress());
		register("fees");
		register("fee", common.fee(remainingBalance, wallet?.network?.()));
		register("memo", sendTransfer.memo());

		register("remainingBalance");
		register("isSendAllSelected");
		register("inputFeeSettings");

		register("suppressWarning");
	}, [register, sendTransfer, common, fees, wallet, remainingBalance, amount, senderAddress]);

	useEffect(() => {
		if (!showNetworkStep) {
			return;
		}

		reset({ ...defaultValues, network });
	}, [network, reset]); // eslint-disable-line react-hooks/exhaustive-deps

	const {
		dismissFeeWarning,
		feeWarningVariant,
		requireFeeConfirmation,
		showFeeWarning,
		setShowFeeWarning,
	} = useFeeConfirmation(fee, fees);

	useEffect(() => {
		setWallet(activeProfile.wallets().findByAddress(senderAddress || ""));
	}, [activeProfile, senderAddress]);

	useEffect(() => {
		if (Object.keys(deepLinkParameters).length === 0) {
			return;
		}

		setValue(
			"network",
			networks.find(
				(item) =>
					lowerCaseEquals(item.coin(), deepLinkParameters.coin) &&
					lowerCaseEquals(item.id(), deepLinkParameters.network),
			),
		);

		if (deepLinkParameters.memo) {
			setValue("memo", deepLinkParameters.memo);
		}

		if (deepLinkParameters.recipient) {
			setTimeout(
				() =>
					setValue("recipientAddress", deepLinkParameters.recipient, {
						shouldDirty: true,
						shouldValidate: false,
					}),
				0,
			);
		}
	}, [deepLinkParameters, setValue, networks]);

	useEffect(() => {
		if (!wallet?.address?.()) {
			return;
		}

		setValue("senderAddress", wallet.address(), { shouldDirty: true, shouldValidate: true });

		for (const network of networks) {
			/* istanbul ignore else */
			if (network.coin() === wallet.coinId() && network.id() === wallet.networkId()) {
				setValue("network", network, { shouldDirty: true, shouldValidate: true });

				break;
			}
		}
	}, [wallet, networks, setValue]);

	useEffect(() => {
		if (!isSendAllSelected) {
			return;
		}

		/* istanbul ignore next */
		if (amount <= fee) {
			// @TODO remove ignore coverage after BigNumber refactor
			return;
		}

		const remaining = remainingBalance - fee;

		setValue("displayAmount", remaining);
		setValue("amount", remaining);

		form.trigger(["fee", "amount"]);
	}, [fee]); // eslint-disable-line react-hooks/exhaustive-deps

	const submitForm = async (skipUnconfirmedCheck = false) => {
		assertWallet(wallet);

		if (!skipUnconfirmedCheck) {
			const unconfirmed = await fetchWalletUnconfirmedTransactions(wallet);
			setUnconfirmedTransactions(unconfirmed);

			if (unconfirmed.length > 0) {
				setIsConfirmModalOpen(true);
				return;
			}
		}

		clearErrors("mnemonic");

		const {
			fee,
			mnemonic,
			secondMnemonic,
			recipients,
			memo,
			encryptionPassword,
			wif,
			privateKey,
			secret,
		} = getValues();
		const isMultiPayment = recipients.length > 1;
		const transactionType = isMultiPayment ? "multiPayment" : "transfer";

		try {
			const signatory = await sign({
				encryptionPassword,
				mnemonic,
				privateKey,
				secondMnemonic,
				secret,
				wif,
			});

			const transactionInput: Services.TransactionInputs = {
				data: {},
				fee: +fee,
				signatory,
			};

			transactionInput.data = isMultiPayment
				? {
						payments: recipients.map(({ address, amount }: { address: string; amount: number }) => ({
							amount: +amount,
							to: address,
						})),
				  }
				: {
						amount: +recipients[0].amount,
						to: recipients[0].address,
				  };

			if (memo) {
				transactionInput.data.memo = memo;
			}

			const expiration = await wallet.coin().transaction().estimateExpiration();
			if (expiration) {
				transactionInput.data.expiration = Number.parseInt(expiration);
				setLastEstimatedExpiration(transactionInput.data.expiration);
			}

			if (wallet.isLedger()) {
				await connect(profile, wallet.coinId(), wallet.networkId());
				await wallet.ledger().connect(transport);
			}

			const abortSignal = abortReference.current?.signal;
			const { uuid, transaction } = await transactionBuilder.build(transactionType, transactionInput, wallet, {
				abortSignal,
			});

			const response = await wallet.transaction().broadcast(uuid);

			handleBroadcastError(response);

			await persist();

			setTransaction(transaction);
			setActiveTab(4);
		} catch (error) {
			setErrorMessage(JSON.stringify({ message: error.message, type: error.name }));
			setActiveTab(5);
		}
	};

	const handleBack = () => {
		// Abort any existing listener
		abortReference.current.abort();

		if (activeTab === firstTabIndex) {
			return history.go(-1);
		}

		setActiveTab(activeTab - 1);
	};

	const handleNext = async (suppressWarning?: boolean) => {
		abortReference.current = new AbortController();

		const newIndex = activeTab + 1;

		if (newIndex === 3 && requireFeeConfirmation && !suppressWarning) {
			return setShowFeeWarning(true);
		}

		const senderWallet = activeProfile.wallets().findByAddress(getValues("senderAddress"));

		// Skip authorization step
		if (newIndex === 3 && senderWallet?.isMultiSignature()) {
			await handleSubmit(() => submitForm(true))();
			return;
		}

		if (newIndex === 3 && senderWallet?.isLedger()) {
			handleSubmit(() => submitForm(true))();
		}

		setActiveTab(newIndex);
	};

	const hideStepNavigation = activeTab === 5 || (activeTab === 3 && wallet?.isLedger());

	return (
		<Page profile={activeProfile}>
			<Section className="flex-1">
				<Form className="mx-auto max-w-xl" context={form} onSubmit={() => submitForm()}>
					<Tabs activeId={activeTab}>
						<StepIndicator
							size={showNetworkStep ? 5 : 4}
							activeIndex={showNetworkStep ? activeTab + 1 : activeTab}
						/>

						<div className="mt-8">
							<TabPanel tabId={0}>
								<NetworkStep profile={activeProfile} networks={networks} />
							</TabPanel>

							<TabPanel tabId={1}>
								<FormStep
									networks={networks}
									profile={activeProfile}
									deeplinkProps={deepLinkParameters}
								/>
							</TabPanel>

							<TabPanel tabId={2}>
								<ReviewStep wallet={wallet!} />
							</TabPanel>

							<TabPanel tabId={3}>
								<AuthenticationStep
									wallet={wallet!}
									ledgerDetails={
										<TransferLedgerReview
											wallet={wallet!}
											estimatedExpiration={lastEstimatedExpiration}
										/>
									}
									ledgerIsAwaitingDevice={!hasDeviceAvailable}
									ledgerIsAwaitingApp={!isConnected}
								/>
							</TabPanel>

							<TabPanel tabId={4}>
								{!!transaction && (
									<SummaryStep
										transaction={transaction}
										senderWallet={wallet!}
										profile={activeProfile}
									/>
								)}
							</TabPanel>

							<TabPanel tabId={5}>
								<ErrorStep
									onBack={() =>
										history.push(`/profiles/${activeProfile.id()}/wallets/${wallet!.id()}`)
									}
									isRepeatDisabled={isSubmitting}
									onRepeat={handleSubmit(submitForm as any)}
									errorMessage={errorMessage}
								/>
							</TabPanel>

							{!hideStepNavigation && (
								<StepNavigation
									onBackClick={handleBack}
									onBackToWalletClick={() =>
										history.push(`/profiles/${activeProfile.id()}/wallets/${wallet?.id()}`)
									}
									onContinueClick={async () => await handleNext()}
									isLoading={isSubmitting}
									isNextDisabled={activeTab === 0 && network ? false : !isValid}
									size={4}
									activeIndex={activeTab}
								/>
							)}
						</div>
					</Tabs>

					<FeeWarning
						isOpen={showFeeWarning}
						variant={feeWarningVariant}
						onCancel={(suppressWarning: boolean) => dismissFeeWarning(handleBack, suppressWarning)}
						onConfirm={(suppressWarning: boolean) =>
							dismissFeeWarning(async () => await handleNext(true), suppressWarning)
						}
					/>

					<ConfirmSendTransaction
						unconfirmedTransactions={unconfirmedTransactions}
						isOpen={isConfirmModalOpen}
						onConfirm={() => {
							setIsConfirmModalOpen(false);
							handleSubmit(() => submitForm(true))();
						}}
						onClose={() => {
							setIsConfirmModalOpen(false);
						}}
					/>
				</Form>
			</Section>
		</Page>
	);
};
