/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/profiles";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { createMemoryHistory } from "history";
import nock from "nock";
import React from "react";
import { Route } from "react-router-dom";
import {
	act,
	env,
	fireEvent,
	getDefaultProfileId,
	MNEMONICS,
	renderWithRouter,
	syncDelegates,
	useDefaultNetMocks,
	waitFor,
	within,
} from "utils/testing-library";

import { Transactions } from "./Transactions";

const history = createMemoryHistory();
let profile: Contracts.IProfile;

const fixtureProfileId = getDefaultProfileId();
let dashboardURL: string;

describe("Transactions", () => {
	beforeAll(async () => {
		useDefaultNetMocks();

		nock("https://neoscan.io/api/main_net/v1/")
			.get("/get_last_transactions_by_address/AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX/1")
			.reply(200, []);

		const emptyResponse = {
			data: [],
			meta: {},
		};

		nock("https://ark-test.payvo.com")
			.get("/api/transactions?limit=30&address=D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD&typeGroup=2")
			.reply(200, () => emptyResponse)
			.get("/api/transactions?limit=30&address=D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb&typeGroup=2")
			.reply(200, () => emptyResponse)
			.get("/api/transactions?limit=30&address=DABCrsfEqhtdzmBrE2AU5NNmdUFCGXKEkr&typeGroup=2")
			.reply(200, () => emptyResponse)
			.persist();

		nock("https://ark-test.payvo.com")
			.get("/api/transactions?page=2&limit=30&address=D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD")
			.reply(200, () => emptyResponse)
			.get("/api/transactions?page=2&limit=30&address=D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb")
			.reply(200, () => emptyResponse)
			.get("/api/transactions?page=2&limit=30&address=DABCrsfEqhtdzmBrE2AU5NNmdUFCGXKEkr")
			.reply(200, () => emptyResponse)
			.persist();

		nock("https://ark-test.payvo.com")
			.get("/api/transactions")
			.query(true)
			.reply(200, () => {
				const { meta, data } = require("tests/fixtures/coins/ark/devnet/transactions.json");
				return {
					data: data.slice(0, 2),
					meta,
				};
			})
			.persist();

		profile = env.profiles().findById(fixtureProfileId);

		await env.profiles().restore(profile);
		await profile.sync();

		await syncDelegates(profile);
	});

	beforeEach(async () => {
		dashboardURL = `/profiles/${fixtureProfileId}/dashboard`;
		history.push(dashboardURL);
		jest.useFakeTimers();

		await profile.sync();
	});

	afterEach(() => {
		jest.clearAllTimers();
	});

	it("should render", async () => {
		const { asFragment, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions profile={profile} wallets={profile.wallets().values()} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(
			() => expect(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")).toHaveLength(4),
			{ timeout: 4000 },
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with custom title", async () => {
		const { asFragment, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions profile={profile} wallets={profile.wallets().values()} title={<h1>Test</h1>} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(
			() => expect(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")).toHaveLength(4),
			{ timeout: 4000 },
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render hidden", async () => {
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard" isVisible={false}>
				<Transactions profile={profile} wallets={profile.wallets().values()} isVisible={false} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should filter by type", async () => {
		const { getByRole, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions profile={profile} wallets={profile.wallets().values()} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(
			() => expect(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")).toHaveLength(4),
			{ timeout: 4000 },
		);

		expect(getByRole("button", { name: /Type/ })).toBeInTheDocument();

		act(() => {
			fireEvent.click(getByRole("button", { name: /Type/ }));
		});

		await waitFor(() => expect(getByTestId("dropdown__option--core-0")).toBeInTheDocument());

		act(() => {
			fireEvent.click(getByTestId("dropdown__option--core-0"));
		});

		await waitFor(() => expect(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")).toHaveLength(4));
	});

	it("should filter by type and see empty results text", async () => {
		const emptyProfile = env.profiles().create("test2");

		emptyProfile.wallets().push(
			await emptyProfile.walletFactory().fromMnemonicWithBIP39({
				coin: "ARK",
				mnemonic: MNEMONICS[1],
				network: "ark.devnet",
			}),
		);

		const { getByRole, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions profile={emptyProfile} wallets={emptyProfile.wallets().values()} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(getByRole("button", { name: /Type/ })).toBeInTheDocument();

		act(() => {
			fireEvent.click(getByRole("button", { name: /Type/ }));
		});

		await waitFor(() => expect(getByTestId("dropdown__option--core-9")).toBeInTheDocument());

		act(() => {
			fireEvent.click(getByTestId("dropdown__option--core-9"));
		});

		await waitFor(() => expect(getByTestId("EmptyBlock")).toBeInTheDocument());
	});

	it("should filter by type and see empty screen", async () => {
		const emptyProfile = env.profiles().create(MNEMONICS[0]);

		emptyProfile.wallets().push(
			await emptyProfile.walletFactory().fromMnemonicWithBIP39({
				coin: "ARK",
				mnemonic: MNEMONICS[0],
				network: "ark.devnet",
			}),
		);

		const { getByRole, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions profile={emptyProfile} wallets={emptyProfile.wallets().values()} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(getByRole("button", { name: /Type/ })).toBeInTheDocument();

		act(() => {
			fireEvent.click(getByRole("button", { name: /Type/ }));
		});

		await waitFor(() => expect(getByTestId("dropdown__option--magistrate-0")).toBeInTheDocument());

		act(() => {
			fireEvent.click(getByTestId("dropdown__option--magistrate-0"));
		});

		await waitFor(() => expect(getByTestId("EmptyBlock")).toBeInTheDocument());
	});

	it("should open detail modal on transaction row click", async () => {
		await env.profiles().restore(profile);
		await profile.sync();

		const { asFragment, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions profile={profile} wallets={profile.wallets().values()} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(
			() => expect(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")).toHaveLength(4),
			{ timeout: 4000 },
		);

		act(() => {
			fireEvent.click(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")[0]);
		});

		await waitFor(() => {
			expect(getByTestId("modal__inner")).toBeInTheDocument();
		});

		act(() => {
			fireEvent.click(getByTestId("modal__close-btn"));
		});

		expect(asFragment()).toMatchSnapshot();
	});

	it("should fetch more transactions", async () => {
		process.env.REACT_APP_IS_UNIT = "1";

		await env.profiles().restore(profile);
		await profile.sync();

		const { asFragment, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions profile={profile} isLoading={false} wallets={profile.wallets().values()} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() => {
			expect(getByTestId("transactions__fetch-more-button")).toHaveTextContent(commonTranslations.VIEW_MORE);
			expect(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")).toHaveLength(4);
		});

		act(() => {
			fireEvent.click(getByTestId("transactions__fetch-more-button"));
		});

		expect(getByTestId("transactions__fetch-more-button")).toHaveTextContent(commonTranslations.LOADING);

		await waitFor(() => {
			expect(getByTestId("transactions__fetch-more-button")).toHaveTextContent(commonTranslations.VIEW_MORE);
			expect(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")).toHaveLength(8);
		});

		process.env.REACT_APP_IS_UNIT = undefined;

		expect(asFragment()).toMatchSnapshot();
	});

	it("should hide view more button when there are no next pages", async () => {
		await env.profiles().restore(profile);
		await profile.sync();

		const { asFragment, getByTestId, queryByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions profile={profile} isLoading={false} wallets={profile.wallets().values()} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() => {
			expect(queryByTestId("transactions__fetch-more-button")).not.toBeInTheDocument();
			expect(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")).toHaveLength(4);
		});

		expect(asFragment()).toMatchSnapshot();
	});

	it("should show loading state if set", async () => {
		await env.profiles().restore(profile);
		await profile.sync();

		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions isLoading={true} profile={profile} wallets={profile.wallets().values()} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() => {
			expect(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")).toHaveLength(8);
		});
	});

	it("should abort previous request", async () => {
		nock.cleanAll();
		const { meta, data } = require("tests/fixtures/coins/ark/devnet/transactions.json");

		nock("https://ark-test.payvo.com")
			.get("/api/transactions")
			.query(true)
			.reply(200, () => ({
				data: data.slice(0, 4),
				meta,
			}))
			.get("/api/transactions")
			.query((parameters) => !!parameters.senderId)
			.delayBody(500)
			.reply(200, () => ({
				data: data.slice(0, 1),
				meta,
			}))
			.get("/api/transactions")
			.query((parameters) => !!parameters.recipientId)
			.reply(200, () => ({
				data: data.slice(0, 3),
				meta,
			}));

		const { getAllByTestId, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions profile={profile} isLoading={false} wallets={profile.wallets().values()} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() => expect(getAllByTestId("TableRow")).toHaveLength(4), { timeout: 500 });

		fireEvent.click(getByTestId("tabs__tab-button-received"));
		fireEvent.click(getByTestId("tabs__tab-button-sent"));

		await waitFor(() => expect(getAllByTestId("TableRow")).toHaveLength(1), { timeout: 1000 });
	});

	it("should filter by mode", async () => {
		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions profile={profile} wallets={profile.wallets().values()} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() => expect(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")).toHaveLength(4));

		act(() => {
			fireEvent.click(getByTestId("tabs__tab-button-sent"));
		});

		await waitFor(() => expect(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")).toHaveLength(1));
	});

	//
	it("should ignore tab change on loading state", async () => {
		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions profile={profile} wallets={profile.wallets().values()} isLoading={true} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() => expect(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")).toHaveLength(8));

		act(() => {
			fireEvent.click(getByTestId("tabs__tab-button-sent"));
		});

		await waitFor(() => expect(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")).toHaveLength(8));
	});

	it("should show empty message", async () => {
		const emptyProfile = env.profiles().create("test-empty");
		const emptyProfileURL = `/profiles/${emptyProfile.id()}/dashboard`;

		history.push(emptyProfileURL);
		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions profile={emptyProfile} wallets={[]} />
			</Route>,
			{
				history,
				routes: [emptyProfileURL],
			},
		);

		await waitFor(() => expect(getByTestId("EmptyBlock")).toBeInTheDocument());
	});

	it("should update wallet filters", async () => {
		const { asFragment, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<Transactions isUpdatingWallet={true} profile={profile} wallets={[]} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() => expect(getByTestId("EmptyBlock")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();
	});
});
