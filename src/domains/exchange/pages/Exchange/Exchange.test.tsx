/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/profiles";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { pluginManager, PluginProviders } from "app/PluginProviders";
import { translations as pluginTranslations } from "domains/plugin/i18n";
import { createMemoryHistory } from "history";
import { LaunchPluginService, PluginController } from "plugins";
import React from "react";
import { Route } from "react-router-dom";
import { act, env, fireEvent, getDefaultProfileId, renderWithRouter, waitFor, within } from "testing-library";

import { translations } from "../../i18n";
import { Exchange } from "./Exchange";

let profile: Contracts.IProfile;
const history = createMemoryHistory();

const exchangeURL = `/profiles/${getDefaultProfileId()}/exchange`;

describe("Exchange", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		history.push(exchangeURL);
	});

	it("should render", () => {
		const { container, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/exchange">
				<PluginProviders>
					<Exchange />
				</PluginProviders>
			</Route>,
			{
				history,
				routes: [exchangeURL],
			},
		);

		expect(getByTestId("header__title")).toHaveTextContent(translations.PAGE_EXCHANGES.TITLE);
		expect(getByTestId("header__subtitle")).toHaveTextContent(translations.PAGE_EXCHANGES.SUBTITLE);

		expect(container).toMatchSnapshot();
	});

	it("should render with exchanges", () => {
		const onEnabled = jest.fn();

		const plugin = new PluginController(
			{ "desktop-wallet": { categories: ["exchange"] }, name: "test-exchange" },
			onEnabled,
		);
		pluginManager.plugins().push(plugin);

		plugin.enable(profile, { autoRun: true });

		const { container, getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/exchange">
				<PluginProviders>
					<Exchange />
				</PluginProviders>
			</Route>,
			{
				history,
				routes: [exchangeURL],
			},
		);

		expect(getByTestId("header__title")).toHaveTextContent(translations.PAGE_EXCHANGES.TITLE);
		expect(getByTestId("header__subtitle")).toHaveTextContent(translations.PAGE_EXCHANGES.SUBTITLE);

		expect(getByText(plugin.config().title())).toBeTruthy();

		expect(container).toMatchSnapshot();

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should launch exchange", async () => {
		const plugin = new PluginController(
			{ "desktop-wallet": { categories: ["exchange"], permissions: ["LAUNCH"] }, name: "test-exchange" },
			(api) => api.launch().render(<h1>My Exchange View</h1>),
		);

		pluginManager.services().register([new LaunchPluginService()]);
		pluginManager.plugins().push(plugin);

		plugin.enable(profile, { autoRun: true });

		const { getAllByTestId, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/exchange">
				<PluginProviders>
					<Exchange />
				</PluginProviders>
			</Route>,
			{
				history,
				routes: [exchangeURL],
			},
		);

		await waitFor(() => expect(getAllByTestId("Card")).toHaveLength(3));
		await waitFor(() => expect(within(getByTestId("ExchangeGrid")).getByTestId("dropdown__toggle")).toBeTruthy());

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		act(() => {
			fireEvent.click(within(getByTestId("ExchangeGrid")).getAllByTestId("Card")[0]);
		});

		const redirectUrl = `/profiles/${profile.id()}/exchange/view?pluginId=test-exchange`;
		await waitFor(() => expect(historySpy).toHaveBeenCalledWith(redirectUrl));

		historySpy.mockRestore();

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should go to plugin details", async () => {
		const onEnabled = jest.fn();

		const plugin = new PluginController(
			{ "desktop-wallet": { categories: ["exchange"] }, name: "test-exchange" },
			onEnabled,
		);

		pluginManager.plugins().push(plugin);

		plugin.enable(profile, { autoRun: true });

		const { getAllByTestId, getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/exchange">
				<PluginProviders>
					<Exchange />
				</PluginProviders>
			</Route>,
			{
				history,
				routes: [exchangeURL],
			},
		);

		await waitFor(() => expect(getAllByTestId("Card")).toHaveLength(3));
		await waitFor(() => expect(within(getByTestId("ExchangeGrid")).getByTestId("dropdown__toggle")).toBeTruthy());

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		fireEvent.click(within(getByTestId("ExchangeGrid")).getAllByTestId("dropdown__toggle")[0]);

		act(() => {
			fireEvent.click(getByText(commonTranslations.DETAILS));
		});

		const redirectUrl = `/profiles/${profile.id()}/plugins/details?pluginId=test-exchange`;
		await waitFor(() => expect(historySpy).toHaveBeenCalledWith(redirectUrl));

		historySpy.mockRestore();

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should render filler exchange cards", () => {
		const { container, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/exchange">
				<PluginProviders>
					<Exchange />
				</PluginProviders>
			</Route>,
			{
				history,
				routes: [exchangeURL],
			},
		);

		expect(within(getByTestId("ExchangeGrid")).getAllByText(commonTranslations.AUTHOR)).toHaveLength(3);
		expect(within(getByTestId("ExchangeGrid")).getAllByText(commonTranslations.EXCHANGE)).toHaveLength(3);

		expect(container).toMatchSnapshot();
	});

	it("should not render filler exchange cards", () => {
		const onEnabled = jest.fn();

		const plugin1 = new PluginController(
			{ "desktop-wallet": { categories: ["exchange"] }, name: "test-exchange-1" },
			onEnabled,
		);
		const plugin2 = new PluginController(
			{ "desktop-wallet": { categories: ["exchange"] }, name: "test-exchange-2" },
			onEnabled,
		);
		const plugin3 = new PluginController(
			{ "desktop-wallet": { categories: ["exchange"] }, name: "test-exchange-3" },
			onEnabled,
		);

		for (const plugin of [plugin1, plugin2, plugin3]) {
			pluginManager.plugins().push(plugin);
			plugin.enable(profile, { autoRun: true });
		}

		const { container, getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/exchange">
				<PluginProviders>
					<Exchange />
				</PluginProviders>
			</Route>,
			{
				history,
				routes: [exchangeURL],
			},
		);

		expect(getByText(plugin1.config().title())).toBeTruthy();
		expect(getByText(plugin2.config().title())).toBeTruthy();
		expect(getByText(plugin3.config().title())).toBeTruthy();

		expect(() => within(getByTestId("ExchangeGrid")).getByText(commonTranslations.AUTHOR)).toThrow(
			/Unable to find an element with/,
		);
		expect(() => within(getByTestId("ExchangeGrid")).getByText(commonTranslations.EXCHANGE)).toThrow(
			/Unable to find an element with/,
		);

		expect(container).toMatchSnapshot();

		for (const plugin of [plugin1, plugin2, plugin3]) {
			pluginManager.plugins().removeById(plugin.config().id(), profile);
		}
	});

	it("should delete exchange", async () => {
		const onEnabled = jest.fn();

		const plugin = new PluginController(
			{ "desktop-wallet": { categories: ["exchange"] }, name: "test-exchange" },
			onEnabled,
		);

		pluginManager.services().register([new LaunchPluginService()]);
		pluginManager.plugins().push(plugin);

		plugin.enable(profile, { autoRun: true });

		const title = plugin.config().title();

		const { getAllByTestId, getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/exchange">
				<PluginProviders>
					<Exchange />
				</PluginProviders>
			</Route>,
			{
				history,
				routes: [exchangeURL],
			},
		);

		await waitFor(() => expect(getAllByTestId("Card")).toHaveLength(3));
		await waitFor(() => expect(within(getByTestId("ExchangeGrid")).getByTestId("dropdown__toggle")).toBeTruthy());

		fireEvent.click(within(getByTestId("ExchangeGrid")).getAllByTestId("dropdown__toggle")[0]);

		act(() => {
			fireEvent.click(getByText(commonTranslations.DELETE));
		});

		expect(getByTestId("modal__inner")).toHaveTextContent(pluginTranslations.MODAL_UNINSTALL.TITLE);

		await act(async () => {
			fireEvent.click(getByTestId("PluginUninstall__submit-button"));
		});

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		expect(() => within(getByTestId("ExchangeGrid")).getByText(title)).toThrow(/Unable to find an element with/);
	});

	it("should open & close uninstall exchange modal", async () => {
		const onEnabled = jest.fn();

		const plugin = new PluginController(
			{ "desktop-wallet": { categories: ["exchange"] }, name: "test-exchange" },
			onEnabled,
		);

		pluginManager.services().register([new LaunchPluginService()]);
		pluginManager.plugins().push(plugin);

		plugin.enable(profile, { autoRun: true });

		const { getAllByTestId, getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/exchange">
				<PluginProviders>
					<Exchange />
				</PluginProviders>
			</Route>,
			{
				history,
				routes: [exchangeURL],
			},
		);

		await waitFor(() => expect(getAllByTestId("Card")).toHaveLength(3));
		await waitFor(() => expect(within(getByTestId("ExchangeGrid")).getByTestId("dropdown__toggle")).toBeTruthy());

		fireEvent.click(within(getByTestId("ExchangeGrid")).getAllByTestId("dropdown__toggle")[0]);

		act(() => {
			fireEvent.click(getByText(commonTranslations.DELETE));
		});

		expect(getByTestId("modal__inner")).toHaveTextContent(pluginTranslations.MODAL_UNINSTALL.TITLE);

		fireEvent.click(getByTestId("modal__close-btn"));

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should open & close add exchange modal", async () => {
		const { container, findByText, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/exchange">
				<PluginProviders>
					<Exchange />
				</PluginProviders>
			</Route>,
			{
				history,
				routes: [exchangeURL],
			},
		);

		fireEvent.click(await findByText(translations.PAGE_EXCHANGES.ADD_EXCHANGE));

		expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_ADD_EXCHANGE.TITLE);

		fireEvent.click(getByTestId("modal__close-btn"));

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		expect(container).toMatchSnapshot();
	});
});
