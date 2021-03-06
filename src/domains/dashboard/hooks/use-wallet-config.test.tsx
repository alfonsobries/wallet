import { uniq } from "@arkecosystem/utils";
import { Contracts } from "@payvo/profiles";
import { act, renderHook } from "@testing-library/react-hooks";
import { ConfigurationProvider, EnvironmentProvider } from "app/contexts";
import React from "react";
import { env, getDefaultProfileId, waitFor } from "utils/testing-library";

import { useWalletConfig } from "./use-wallet-config";

let profile: Contracts.IProfile;

describe("useWalletConfig", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
	});

	it("should have default configuration", () => {
		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>{children}</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const {
			result: { current },
		} = renderHook(() => useWalletConfig({ profile }), { wrapper });

		expect(current.selectedWallets).toHaveLength(2);

		const defaultNetworkIds = uniq(
			profile
				.wallets()
				.values()
				.map((wallet) => wallet.network().id()),
		);

		expect(current.selectedNetworkIds).toEqual(defaultNetworkIds);
		expect(current.walletsDisplayType).toEqual("all");
		expect(current.viewType).toEqual("grid");
	});

	it("should render with ledger wallet display type", async () => {
		profile.wallets().first().toggleStarred();

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>{children}</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const { result } = renderHook(() => useWalletConfig({ defaults: { walletsDisplayType: "ledger" }, profile }), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.walletsDisplayType).toEqual("ledger");
		});
	});

	it("should render with star wallet display type", async () => {
		profile.wallets().first().toggleStarred();

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>{children}</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const { result } = renderHook(() => useWalletConfig({ defaults: { walletsDisplayType: "starred" }, profile }), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.walletsDisplayType).toEqual("starred");
		});
	});

	it("should render with no networks selected", async () => {
		profile.wallets().first().toggleStarred();

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>{children}</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const { result } = renderHook(() => useWalletConfig({ defaults: { selectedNetworkIds: [] }, profile }), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.selectedNetworkIds).toEqual([]);
		});
	});

	it("should set value", async () => {
		profile.wallets().first().toggleStarred();

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>{children}</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const { result } = renderHook(() => useWalletConfig({ defaults: { selectedNetworkIds: [] }, profile }), {
			wrapper,
		});

		// eslint-disable-next-line @typescript-eslint/require-await
		await act(async () => {
			result.current.setValue("selectedNetworkIds", ["ark.devnet"]);
		});

		await waitFor(() => {
			expect(result.current.selectedNetworkIds).toEqual(["ark.devnet"]);
		});
	});
});
