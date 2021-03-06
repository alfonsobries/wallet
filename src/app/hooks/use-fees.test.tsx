import { ARK } from "@payvo/sdk-ark";
import { renderHook } from "@testing-library/react-hooks";
import { EnvironmentProvider } from "app/contexts";
import { httpClient } from "app/services";
import React from "react";
import { StubStorage } from "tests/mocks";
import { env, getDefaultProfileId } from "utils/testing-library";

import { useFees } from "./use-fees";

describe("useFees", () => {
	it("should find fees by type if already synced", async () => {
		const profile = env.profiles().findById(getDefaultProfileId());

		await env.wallets().syncByProfile(profile);
		await env.delegates().syncAll(profile);

		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children} </EnvironmentProvider>;
		const {
			result: { current },
		} = renderHook(() => useFees(profile), { wrapper });

		await env.fees().sync(profile, "ARK", "ark.devnet");

		await expect(current.findByType("ARK", "ark.devnet", "ipfs")).resolves.toEqual({
			avg: 5,
			max: 5,
			min: 5,
			static: 5,
		});
	});

	it("should ensure fees are synced before find", async () => {
		env.reset({ coins: { ARK }, httpClient, storage: new StubStorage() });

		const profile = env.profiles().create("John Doe");
		await env.profiles().restore(profile);
		await profile.walletFactory().generate({
			coin: "ARK",
			network: "ark.devnet",
		});
		await env.wallets().syncByProfile(profile);

		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children} </EnvironmentProvider>;
		const {
			result: { current },
		} = renderHook(() => useFees(profile), { wrapper });

		await env.fees().sync(profile, "ARK", "ark.devnet");

		await expect(current.findByType("ARK", "ark.devnet", "ipfs")).resolves.toEqual({
			avg: 5,
			max: 5,
			min: 5,
			static: 5,
		});
	});

	it("should retry find fees by type", async () => {
		env.reset({ coins: { ARK }, httpClient, storage: new StubStorage() });

		const mockFind = jest.spyOn(env.fees(), "findByType").mockImplementationOnce(() => {
			throw new Error("test");
		});

		const profile = env.profiles().create("John Doe");
		await env.profiles().restore(profile);
		await profile.walletFactory().generate({
			coin: "ARK",
			network: "ark.devnet",
		});
		await env.wallets().syncByProfile(profile);

		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children} </EnvironmentProvider>;
		const {
			result: { current },
		} = renderHook(() => useFees(profile), { wrapper });

		await env.fees().sync(profile, "ARK", "ark.devnet");

		await expect(current.findByType("ARK", "ark.devnet", "ipfs")).resolves.toEqual({
			avg: 5,
			max: 5,
			min: 5,
			static: 5,
		});

		mockFind.mockRestore();
	});
});
