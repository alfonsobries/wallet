import { Contracts as ProfilesContracts } from "@payvo/profiles";
import { Networks } from "@payvo/sdk";
import { FormField, FormLabel } from "app/components/Form";
import { Header } from "app/components/Header";
import { useEnvironmentContext } from "app/contexts";
import { useFees } from "app/hooks";
import { InputFee } from "domains/transaction/components/InputFee";
import {
	TransactionDetail,
	TransactionNetwork,
	TransactionSender,
} from "domains/transaction/components/TransactionDetail";
import { VoteList } from "domains/vote/components/VoteList";
import React, { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

export const FormStep = ({
	unvotes,
	votes,
	wallet,
	profile,
}: {
	profile: ProfilesContracts.IProfile;
	unvotes: ProfilesContracts.IReadOnlyWallet[];
	votes: ProfilesContracts.IReadOnlyWallet[];
	wallet: ProfilesContracts.IReadWriteWallet;
}) => {
	const { env } = useEnvironmentContext();
	const { t } = useTranslation();

	const { findByType } = useFees(profile);

	const form = useFormContext();
	const { setValue, watch } = form;
	const { fee, fees } = watch();

	const inputFeeSettings = watch("inputFeeSettings") ?? {};

	useEffect(() => {
		const setFees = async (network: Networks.Network) => {
			const fees = await findByType(network.coin(), network.id(), "vote");

			setValue("fees", fees);
			setValue("fee", fees?.avg, {
				shouldDirty: true,
				shouldValidate: true,
			});
		};

		setFees(wallet.network());
	}, [env, wallet, setValue, findByType]);

	const showFeeInput = useMemo(() => !wallet.network().chargesZeroFees(), [wallet]);

	return (
		<section data-testid="SendVote__form-step">
			<Header
				title={t("TRANSACTION.PAGE_VOTE.FORM_STEP.TITLE")}
				subtitle={t("TRANSACTION.PAGE_VOTE.FORM_STEP.DESCRIPTION")}
			/>

			<TransactionNetwork network={wallet.network()} border={false} />

			<TransactionSender
				address={wallet.address()}
				alias={wallet.alias()}
				isDelegate={wallet.isDelegate() && !wallet.isResignedDelegate()}
			/>

			{unvotes.length > 0 && (
				<TransactionDetail label={t("TRANSACTION.UNVOTES_COUNT", { count: unvotes.length })}>
					<VoteList votes={unvotes} />
				</TransactionDetail>
			)}

			{votes.length > 0 && (
				<TransactionDetail label={t("TRANSACTION.VOTES_COUNT", { count: votes.length })}>
					<VoteList votes={votes} />
				</TransactionDetail>
			)}

			{showFeeInput && (
				<TransactionDetail paddingPosition="top">
					<FormField name="fee">
						<FormLabel label={t("TRANSACTION.TRANSACTION_FEE")} />
						<InputFee
							min={fees?.min}
							avg={fees?.avg}
							max={fees?.max}
							loading={!fees}
							value={fee}
							step={0.01}
							disabled={wallet.network().feeType() !== "dynamic"}
							network={wallet.network()}
							profile={profile}
							onChange={(value) => {
								setValue("fee", value, { shouldDirty: true, shouldValidate: true });
							}}
							viewType={inputFeeSettings.viewType}
							onChangeViewType={(viewType) => {
								setValue(
									"inputFeeSettings",
									{ ...inputFeeSettings, viewType },
									{ shouldDirty: true, shouldValidate: true },
								);
							}}
							simpleValue={inputFeeSettings.simpleValue}
							onChangeSimpleValue={(simpleValue) => {
								setValue(
									"inputFeeSettings",
									{ ...inputFeeSettings, simpleValue },
									{ shouldDirty: true, shouldValidate: true },
								);
							}}
						/>
					</FormField>
				</TransactionDetail>
			)}
		</section>
	);
};
