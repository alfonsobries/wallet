import { Contracts } from "@payvo/profiles";
import { Avatar } from "app/components/Avatar";
import { FormField, FormLabel } from "app/components/Form";
import { Header } from "app/components/Header";
import { Input, InputDefault, InputPassword } from "app/components/Input";
import { useValidation } from "app/hooks";
import React, { ChangeEvent } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

export const FormStep = ({
	wallet,
	disableMessageInput,
}: {
	wallet: Contracts.IReadWriteWallet;
	disableMessageInput?: boolean;
}) => {
	const { t } = useTranslation();

	const { authentication } = useValidation();

	const { register, setValue } = useFormContext();

	const subtitle = wallet.isLedger()
		? t("WALLETS.MODAL_SIGN_MESSAGE.FORM_STEP.DESCRIPTION_LEDGER")
		: wallet.wif().exists()
		? t("WALLETS.MODAL_SIGN_MESSAGE.FORM_STEP.DESCRIPTION_ENCRYPTION_PASSWORD")
		: t("WALLETS.MODAL_SIGN_MESSAGE.FORM_STEP.DESCRIPTION_MNEMONIC");

	return (
		<section className="space-y-5">
			<Header title={t("WALLETS.MODAL_SIGN_MESSAGE.FORM_STEP.TITLE")} subtitle={subtitle} />

			<FormField name="signatory-address">
				<FormLabel label={t("WALLETS.SIGNATORY")} />
				<Input
					innerClassName="font-semibold"
					value={wallet.address()}
					addons={{
						start: {
							content: <Avatar address={wallet.address()} size="sm" noShadow />,
						},
					}}
					disabled
				/>
			</FormField>

			<FormField name="message">
				<FormLabel label={t("COMMON.MESSAGE")} />
				<InputDefault
					ref={register({
						required: t("COMMON.VALIDATION.FIELD_REQUIRED", {
							field: t("COMMON.MESSAGE"),
						}).toString(),
					})}
					onChange={(event: ChangeEvent<HTMLInputElement>) =>
						setValue("message", event.target.value, {
							shouldDirty: true,
							shouldValidate: true,
						})
					}
					data-testid="SignMessage__message-input"
					readOnly={disableMessageInput}
				/>
			</FormField>

			{!wallet.isLedger() && !wallet.wif().exists() && wallet.actsWithMnemonic() && (
				<FormField name="mnemonic">
					<FormLabel label={t("COMMON.MNEMONIC")} />
					<InputPassword
						ref={register(authentication.mnemonic(wallet))}
						data-testid="SignMessage__mnemonic-input"
					/>
				</FormField>
			)}

			{!wallet.isLedger() && !wallet.wif().exists() && wallet.actsWithSecret() && (
				<FormField name="secret">
					<FormLabel label={t("COMMON.SECRET")} />
					<InputPassword
						ref={register(authentication.secret(wallet))}
						data-testid="SignMessage__secret-input"
					/>
				</FormField>
			)}

			{!wallet.isLedger() && wallet.wif().exists() && (
				<FormField name="encryptionPassword">
					<FormLabel>{t("TRANSACTION.ENCRYPTION_PASSWORD")}</FormLabel>
					<InputPassword
						data-testid="SignMessage__encryption-password"
						ref={register(authentication.encryptionPassword(wallet))}
					/>
				</FormField>
			)}
		</section>
	);
};

FormStep.defaultProps = {
	disableMessageInput: false,
};
