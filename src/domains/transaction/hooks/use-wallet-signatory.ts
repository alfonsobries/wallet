import { Contracts as ProfileContracts } from "@payvo/profiles";
import { Signatories } from "@payvo/sdk";
import { useCallback } from "react";
import { assertString } from "utils/assertions";

export interface SignInput {
	encryptionPassword?: string;
	mnemonic?: string;
	secondMnemonic?: string;
	secret?: string;
	wif?: string;
	privateKey?: string;
}

export const useWalletSignatory = (
	wallet: ProfileContracts.IReadWriteWallet,
): {
	sign: ({
		mnemonic,
		secondMnemonic,
		encryptionPassword,
		wif,
		privateKey,
		secret,
	}: SignInput) => Promise<Signatories.Signatory>;
} => ({
	sign: useCallback(
		async ({ mnemonic, secondMnemonic, encryptionPassword, wif, privateKey, secret }: SignInput) => {
            let multiSignature: ProfileContracts.IMultiSignature | undefined;

			if (wallet.isMultiSignature()) {
				multiSignature = wallet.multiSignature();
			}

			if (mnemonic && secondMnemonic) {
				return wallet.signatory().secondaryMnemonic(mnemonic, secondMnemonic, { multiSignature });
			}

			if (mnemonic) {
				return wallet.signatory().mnemonic(mnemonic, { multiSignature });
			}

			if (encryptionPassword) {
				return wallet.signatory().wif(await wallet.wif().get(encryptionPassword), { multiSignature });
			}

			if (wallet.isLedger()) {
                const derivationPath: string | undefined = wallet.data().get(ProfileContracts.WalletData.DerivationPath);

                assertString(derivationPath);

				return wallet.signatory().ledger(derivationPath, { multiSignature });
			}

			if (wif) {
				return wallet.signatory().wif(wif, { multiSignature });
			}

			if (privateKey) {
				return wallet.signatory().privateKey(privateKey, { multiSignature });
			}

			if (secret) {
				return wallet.signatory().secret(secret, { multiSignature });
			}

			throw new Error("Signing failed. No mnemonic or encryption password provided");
		},
		[wallet],
	),
});
