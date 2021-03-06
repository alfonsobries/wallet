import { Contracts } from "@payvo/profiles";
import * as useRandomNumberHook from "app/hooks/use-random-number";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { act, env, fireEvent, getDefaultProfileId, renderWithRouter } from "testing-library";

import { WalletCard } from "./WalletCard";

const dashboardURL = `/profiles/${getDefaultProfileId()}/dashboard`;
const history = createMemoryHistory();

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;

describe("Wallet Card", () => {
	beforeAll(() => {
		jest.spyOn(useRandomNumberHook, "useRandomNumber").mockImplementation(() => 1);

		history.push(dashboardURL);
	});

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		wallet.data().set(Contracts.WalletFlag.Starred, true);
		wallet.data().set(Contracts.WalletData.DerivationPath, "0");

		await wallet.synchroniser().identity();
		jest.spyOn(wallet, "isMultiSignature").mockReturnValue(true);
	});

	afterAll(() => {
		useRandomNumberHook.useRandomNumber.mockRestore();
	});

	it("should render", () => {
		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard wallet={wallet} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(container).toMatchSnapshot();
	});

	it("should render loading state", () => {
		const { container, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard isLoading={true} wallet={wallet} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(getByTestId("WalletCard__skeleton")).toBeTruthy();
		expect(container).toMatchSnapshot();
	});

	it("should render with actions", () => {
		const actions = [{ label: "show", value: "show" }];

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard wallet={wallet} actions={actions} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(container).toMatchSnapshot();
	});

	it("should render blank", () => {
		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(container).toMatchSnapshot();
	});

	it("should render blank with starred display type", () => {
		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard displayType="starred" />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(container).toHaveTextContent("star.svg");
		expect(container).toMatchSnapshot();
	});

	it("should render blank with ledger display type", () => {
		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard displayType="ledger" />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(container).toHaveTextContent("ledger.svg");
		expect(container).toMatchSnapshot();
	});

	it("should render with wallet data", () => {
		wallet.settings().set(Contracts.WalletSetting.Alias, "My wallet");

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard wallet={wallet} />,
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(container).toMatchSnapshot();
	});

	it("should render with wallet data and optional icon", () => {
		wallet.settings().set(Contracts.WalletSetting.Alias, "My wallet");

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard wallet={wallet} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(container).toMatchSnapshot();
	});

	it("should click a wallet and redirect to it", () => {
		const { getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard wallet={wallet} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/dashboard`);

		act(() => {
			fireEvent.click(getByText("D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD"));
		});

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/wallets/${wallet.id()}`);
	});
});
