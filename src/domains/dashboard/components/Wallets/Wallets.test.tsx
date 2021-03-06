import Transport from "@ledgerhq/hw-transport";
import { createTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { Contracts } from "@payvo/profiles";
import { LedgerProvider } from "app/contexts/Ledger/Ledger";
import * as useRandomNumberHook from "app/hooks/use-random-number";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { translations as dashboardTranslations } from "domains/dashboard/i18n";
import { translations as walletTranslations } from "domains/wallet/i18n";
import { createMemoryHistory } from "history";
import nock from "nock";
import React from "react";
import { Route } from "react-router-dom";
import {
	act,
	env,
	fireEvent,
	getDefaultProfileId,
	renderWithRouter,
	syncDelegates,
	waitFor,
} from "utils/testing-library";

import { Wallets } from "./Wallets";

const history = createMemoryHistory();
const dashboardURL = `/profiles/${getDefaultProfileId()}/dashboard`;

let profile: Contracts.IProfile;
let emptyProfile: Contracts.IProfile;
let wallets: Contracts.IReadWriteWallet[];

const transport: typeof Transport = createTransportReplayer(RecordStore.fromString(""));

describe("Wallets", () => {
	beforeAll(async () => {
		jest.spyOn(useRandomNumberHook, "useRandomNumber").mockImplementation(() => 1);

		nock("https://neoscan.io/api/main_net/v1/")
			.get("/get_last_transactions_by_address/AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX/1")
			.reply(200, []);

		history.push(dashboardURL);

		emptyProfile = env.profiles().create("Empty");
		profile = env.profiles().findById(getDefaultProfileId());

		await env.profiles().restore(profile);
		await profile.sync();

		const wallet = await profile.walletFactory().fromAddress({
			address: "AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX",
			coin: "ARK",
			network: "ark.mainnet",
		});

		profile.wallets().push(wallet);

		wallets = profile.wallets().values();

		await syncDelegates(profile);
	});

	afterAll(() => {
		useRandomNumberHook.useRandomNumber.mockRestore();
	});

	it("should render grid", () => {
		const { asFragment, getAllByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(getAllByTestId("WalletsGrid")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render grid in loading state", () => {
		const { asFragment, getAllByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets isLoading={true} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(getAllByTestId("WalletsGrid")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render list", async () => {
		const { asFragment, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		const toggle = getByTestId("LayoutControls__list--icon");
		act(() => {
			fireEvent.click(toggle);
		});

		await waitFor(() => expect(getByTestId("WalletsList")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should toggle between grid and list view", async () => {
		const { asFragment, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		act(() => {
			fireEvent.click(getByTestId("LayoutControls__list--icon"));
		});

		await waitFor(() => expect(getByTestId("WalletsList")).toBeTruthy());

		act(() => {
			fireEvent.click(getByTestId("LayoutControls__grid--icon"));
		});

		expect(getByTestId("WalletsGrid")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render without testnet wallets", () => {
		profile.settings().set(Contracts.ProfileSetting.UseTestNetworks, false);

		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(asFragment()).toMatchSnapshot();

		profile.settings().set(Contracts.ProfileSetting.UseTestNetworks, true);
	});

	it("should load more wallets", async () => {
		const { asFragment, getByTestId, getAllByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets listPagerLimit={1} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		const toggle = getByTestId("LayoutControls__list--icon");
		act(() => {
			fireEvent.click(toggle);
		});

		await waitFor(() => expect(getByTestId("WalletsList")).toBeTruthy());
		await waitFor(() => expect(getByTestId("WalletsList__ViewMore")).toBeTruthy());

		act(() => {
			fireEvent.click(getByTestId("WalletsList__ViewMore"));
		});

		await waitFor(() => expect(getAllByTestId("TableRow")).toHaveLength(3));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle wallet creation", () => {
		const onCreateWallet = jest.fn();
		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets onCreateWallet={onCreateWallet} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		fireEvent.click(getByTestId("WalletControls__create-wallet"));

		expect(onCreateWallet).toHaveBeenCalled();
	});

	it("should handle wallet import", () => {
		const onImportWallet = jest.fn();
		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets onImportWallet={onImportWallet} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		fireEvent.click(getByTestId("WalletControls__import-wallet"));

		expect(onImportWallet).toHaveBeenCalled();
	});

	it("should handle filter change", async () => {
		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		act(() => {
			fireEvent.click(getByTestId("dropdown__toggle"));
		});

		act(() => {
			fireEvent.click(getByTestId("filter-wallets__wallets"));
		});

		act(() => {
			fireEvent.click(getByTestId("dropdown__option--1"));
		});

		await waitFor(() =>
			expect(getByTestId("filter-wallets__wallets")).toHaveTextContent(commonTranslations.STARRED),
		);

		act(() => {
			fireEvent.click(getByTestId("filter-wallets__wallets"));
		});

		act(() => {
			fireEvent.click(getByTestId("dropdown__option--0"));
		});

		await waitFor(() => expect(getByTestId("filter-wallets__wallets")).toHaveTextContent(commonTranslations.ALL));
	});

	it("should open and close ledger import modal", async () => {
		const unsubscribe = jest.fn();
		const listenSpy = jest.spyOn(transport, "listen").mockImplementationOnce(() => ({ unsubscribe }));

		const { asFragment, getByTestId, getByText, queryByText } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<LedgerProvider transport={transport}>
					<Wallets />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		act(() => {
			fireEvent.click(getByText(dashboardTranslations.WALLET_CONTROLS.IMPORT_LEDGER));
		});

		await waitFor(() =>
			expect(getByText(walletTranslations.MODAL_LEDGER_WALLET.CONNECT_DEVICE)).toBeInTheDocument(),
		);

		act(() => {
			fireEvent.click(getByTestId("modal__close-btn"));
		});

		await waitFor(() =>
			expect(queryByText(walletTranslations.MODAL_LEDGER_WALLET.CONNECT_DEVICE)).not.toBeInTheDocument(),
		);

		act(() => {
			fireEvent.click(getByText(dashboardTranslations.WALLET_CONTROLS.IMPORT_LEDGER));
		});

		await waitFor(() =>
			expect(getByText(walletTranslations.MODAL_LEDGER_WALLET.CONNECT_DEVICE)).toBeInTheDocument(),
		);

		expect(asFragment()).toMatchSnapshot();

		listenSpy.mockReset();
	});

	it("should handle list wallet click", () => {
		const { getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		const toggle = getByTestId("LayoutControls__list--icon");
		act(() => {
			fireEvent.click(toggle);
		});

		act(() => {
			fireEvent.click(getByText(wallets[0].alias()!));
		});

		expect(history.location.pathname).toMatch(`/profiles/${profile.id()}/wallets/${wallets[0].id()}`);
	});

	it("should render empty profile wallets", async () => {
		history.push(`/profiles/${emptyProfile.id()}/dashboard`);

		const { asFragment, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [`/profiles/${emptyProfile.id()}/dashboard`],
			},
		);

		const toggle = getByTestId("LayoutControls__list--icon");
		act(() => {
			fireEvent.click(toggle);
		});

		await waitFor(() => expect(getByTestId("WalletsList")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});
});
