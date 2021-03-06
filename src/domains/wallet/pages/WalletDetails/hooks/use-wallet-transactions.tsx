import { Contracts, DTO } from "@payvo/profiles";
import { useSynchronizer } from "app/hooks";
import { useTransaction } from "domains/transaction/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";

export const useWalletTransactions = (wallet: Contracts.IReadWriteWallet) => {
	const { fetchWalletUnconfirmedTransactions } = useTransaction();

	const [pendingTransfers, setPendingTransfers] = useState<DTO.ExtendedConfirmedTransactionData[]>([]);
	const [pendingSigned, setPendingSigned] = useState<DTO.ExtendedSignedTransactionData[]>([]);

	const syncPending = useCallback(async () => {
		await wallet.transaction().sync();
		const sent = await fetchWalletUnconfirmedTransactions(wallet);

		setPendingTransfers(sent);

		setPendingSigned(
			Object.values({
				...wallet.transaction().waitingForOtherSignatures(),
				...wallet.transaction().waitingForOurSignature(),
				...wallet.transaction().signed(),
			}).filter((item) => !!item.get("multiSignature")),
		);
	}, [wallet, setPendingTransfers, setPendingSigned, fetchWalletUnconfirmedTransactions]);

	const jobs = useMemo(
		() => [
			{
				callback: syncPending,
				interval: 5000,
			},
		],
		[syncPending],
	);

	const { start, stop } = useSynchronizer(jobs);

	useEffect(() => {
		start();
		return () => stop();
	}, [start, stop]);

	return {
		pendingSigned,
		pendingTransfers,
		syncPending,
	};
};
