import { Contracts } from "@payvo/profiles";
import { renderHook } from "@testing-library/react-hooks";
import { EnvironmentProvider } from "app/contexts";
import React from "react";
import { env, getDefaultProfileId, getDefaultWalletId, syncDelegates } from "utils/testing-library";

import { useWalletAlias } from "./use-wallet-alias";

describe("useWalletAlias", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;

	const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children}</EnvironmentProvider>;

	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().findById(getDefaultWalletId());
	});

	it("should return undefined alias when no wallet or contact or delegate was found", () => {
		const { result } = renderHook(() => useWalletAlias(), { wrapper });

		expect(result.current.getWalletAlias({ address: "wrong-address", profile })).toEqual({
			alias: undefined,
			isContact: false,
			isDelegate: false,
			isKnown: false,
		});
	});

	it("should return contact name and isKnown = true when contact is also known wallet", async () => {
		const contact = profile.contacts().create("Test");
		await contact.setAddresses([{ address: wallet.address(), coin: wallet.coinId(), network: wallet.networkId() }]);

		const { result } = renderHook(() => useWalletAlias(), { wrapper });

		expect(result.current.getWalletAlias({ address: wallet.address(), profile })).toEqual({
			alias: contact.name(),
			isContact: true,
			isDelegate: false,
			isKnown: true,
		});

		profile.contacts().forget(contact.id());
	});

	it("should return contact name and isDelegate = true when contact is also delegate", async () => {
		const contact = profile.contacts().create("Test");
		await contact.setAddresses([{ address: wallet.address(), coin: wallet.coinId(), network: wallet.networkId() }]);

		jest.spyOn(env.delegates(), "findByAddress").mockReturnValueOnce({
			username: () => "delegate username",
		} as any);

		const { result } = renderHook(() => useWalletAlias(), { wrapper });

		expect(
			result.current.getWalletAlias({ address: wallet.address(), network: wallet.network(), profile }),
		).toEqual({
			alias: contact.name(),
			isContact: true,
			isDelegate: true,
			isKnown: true,
		});

		profile.contacts().forget(contact.id());
	});

	it("should return displayName", () => {
		const { result } = renderHook(() => useWalletAlias(), { wrapper });

		expect(result.current.getWalletAlias({ address: wallet.address(), profile })).toEqual({
			alias: wallet.displayName(),
			isContact: false,
			isDelegate: false,
			isKnown: true,
		});
	});

	it("should return displayName and isDelegate = true when address is also a delegate", () => {
		jest.spyOn(env.delegates(), "findByAddress").mockReturnValueOnce({
			username: () => "delegate username",
		} as any);

		const { result } = renderHook(() => useWalletAlias(), { wrapper });

		expect(result.current.getWalletAlias({ address: wallet.address(), profile })).toEqual({
			alias: wallet.displayName(),
			isContact: false,
			isDelegate: true,
			isKnown: true,
		});
	});

	it("should return delegate name", async () => {
		await syncDelegates(profile);

		const walletsSpy = jest.spyOn(profile.wallets(), "findByAddress").mockReturnValue(undefined);
		const contactsSpy = jest.spyOn(profile.contacts(), "findByAddress").mockReturnValue([]);

		const delegate = env.delegates().all(wallet.coinId(), wallet.networkId())[0];

		const { result } = renderHook(() => useWalletAlias(), { wrapper });

		expect(
			result.current.getWalletAlias({
				address: delegate.address(),
				network: wallet.network(),
				profile,
			}),
		).toEqual({
			alias: delegate.username(),
			isContact: false,
			isDelegate: true,
			isKnown: false,
		});

		walletsSpy.mockRestore();
		contactsSpy.mockRestore();
	});
});
