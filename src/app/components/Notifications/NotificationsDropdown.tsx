import { Contracts, DTO } from "@payvo/profiles";
import { Button } from "app/components/Button";
import { Dropdown } from "app/components/Dropdown";
import { Icon } from "app/components/Icon";
import { NavigationButtonWrapper } from "app/components/NavigationBar";
import { Notifications } from "app/components/Notifications";
import { TransactionDetailModal } from "domains/transaction/components/TransactionDetailModal";
import { WalletUpdate } from "domains/wallet/components/WalletUpdate";
import React, { useState } from "react";

export const NotificationsDropdown = ({ profile }: { profile: Contracts.IProfile }) => {
	const [transactionModalItem, setTransactionModalItem] = useState<DTO.ExtendedConfirmedTransactionData>();
	const [isWalletUpdateOpen, setIsWalletUpdateOpen] = useState<boolean>();
	const [walletUpdateVersion, setWalletUpdateVersion] = useState<string>();

	const hasUnread = profile.notifications().hasUnread();

	const handleNotificationAction = (id: string) => {
		const notification = profile.notifications().get(id);
		const action = `${notification.type}.${notification.action}`;

		switch (action) {
			case "release.update":
				setWalletUpdateVersion(notification?.meta?.version);
				setIsWalletUpdateOpen(true);
				break;
		}
	};

	return (
		<div>
			<Dropdown
				dropdownClass="mt-8"
				toggleContent={
					<NavigationButtonWrapper className="group">
						<Button variant="transparent" size="icon" data-testid="navbar__buttons--notifications">
							<Icon name="Notification" size="lg" className="p-1" />
							{hasUnread && (
								<div className="flex absolute right-0 justify-center items-center mr-3 -mt-3 w-3 h-3 rounded-full transition-all duration-100 ease-linear bg-theme-background dark:group-hover:bg-theme-secondary-800 group-hover:bg-theme-primary-100">
									<div className="w-2 h-2 rounded-full bg-theme-danger-500" />
								</div>
							)}
						</Button>
					</NavigationButtonWrapper>
				}
			>
				<div className="mt-2">
					<Notifications
						profile={profile}
						onTransactionClick={setTransactionModalItem}
						onNotificationAction={handleNotificationAction}
					/>
				</div>
			</Dropdown>

			{transactionModalItem && (
				<TransactionDetailModal
					isOpen={!!transactionModalItem}
					transactionItem={transactionModalItem}
					onClose={() => setTransactionModalItem(undefined)}
				/>
			)}

			<WalletUpdate
				version={walletUpdateVersion}
				isOpen={isWalletUpdateOpen}
				onClose={() => setIsWalletUpdateOpen(false)}
				onCancel={() => setIsWalletUpdateOpen(false)}
			/>
		</div>
	);
};
