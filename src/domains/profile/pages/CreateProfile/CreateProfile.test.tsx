/* eslint-disable @typescript-eslint/require-await */
import { ARK } from "@payvo/sdk-ark";
import { EnvironmentProvider } from "app/contexts";
import { httpClient } from "app/services";
import electron from "electron";
import os from "os";
import React from "react";
import { act, env, fireEvent, renderWithRouter, waitFor } from "testing-library";
import { StubStorage } from "tests/mocks";
import * as utils from "utils/electron-utils";

import { CreateProfile } from "./CreateProfile";

jest.mock("fs", () => ({
	readFileSync: jest.fn(() => "avatarImage"),
}));

let showOpenDialogMock: jest.SpyInstance;

const showOpenDialogParameters = {
	defaultPath: os.homedir(),
	filters: [{ extensions: ["png", "jpg", "jpeg", "bmp"], name: "" }],
	properties: ["openFile"],
};

const baseSettings = {
	ACCENT_COLOR: "green",
	ADVANCED_MODE: false,
	AUTOMATIC_SIGN_OUT_PERIOD: 15,
	BIP39_LOCALE: "english",
	DASHBOARD_TRANSACTION_HISTORY: true,
	DO_NOT_SHOW_FEE_WARNING: false,
	ERROR_REPORTING: false,
	EXCHANGE_CURRENCY: "BTC",
	LOCALE: "en-US",
	MARKET_PROVIDER: "cryptocompare",
	NAME: "test profile",
	SCREENSHOT_PROTECTION: true,
	THEME: "dark",
	TIME_FORMAT: "h:mm A",
	USE_TEST_NETWORKS: false,
};

const renderComponent = async () => {
	const result = renderWithRouter(
		<EnvironmentProvider env={env}>
			<CreateProfile />
		</EnvironmentProvider>,
	);
	await waitFor(() => expect(result.getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));
	return result;
};

jest.mock("fs", () => ({
	readFileSync: jest.fn(() => "avatarImage"),
}));

const BASE64_REGEX = /(?:[\d+/A-Za-z]{4})*(?:[\d+/A-Za-z]{2}==|[\d+/A-Za-z]{3}=)?/g;

describe("CreateProfile", () => {
	beforeAll(() => {
		env.reset({ coins: { ARK }, httpClient, storage: new StubStorage() });
	});

	beforeEach(() => {
		showOpenDialogMock = jest.spyOn(electron.remote.dialog, "showOpenDialog").mockImplementation(() => ({
			filePaths: ["banner.png"],
		}));
	});

	it("should render", async () => {
		const { container, getByText, asFragment } = await renderComponent();

		expect(container).toBeTruthy();

		fireEvent.click(getByText("Back"));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should store profile", async () => {
		const { asFragment, container, getAllByTestId, getByTestId } = await renderComponent();

		// Upload avatar image
		await act(async () => {
			fireEvent.click(getByTestId("SelectProfileImage__upload-button"));
		});

		expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters);

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "test profile 1" } });

		const selectDropdown = getByTestId("SelectDropdown__input");

		await act(async () => {
			fireEvent.change(selectDropdown, { target: { value: "BTC" } });
		});

		fireEvent.click(getByTestId("SelectDropdown__option--0"));

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));
		await act(async () => {
			fireEvent.click(getByTestId("CreateProfile__submit-button"));
		});

		let profiles = env.profiles().values();

		expect(profiles.length).toEqual(1);
		expect(profiles[0].name()).toEqual("test profile 1");
		expect(profiles[0].settings().all()).toEqual({
			...baseSettings,
			AVATAR: expect.stringMatching(BASE64_REGEX),
			NAME: "test profile 1",
			THEME: "dark",
		});
		expect(profiles[0].usesPassword()).toBe(false);

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "test profile 2" } });
		fireEvent.click(container.querySelector("input[name=isDarkMode]"));

		await act(async () => {
			fireEvent.click(getByTestId("CreateProfile__submit-button"));
		});

		profiles = env.profiles().values();

		expect(profiles.length).toEqual(2);
		expect(profiles[1].name()).toEqual("test profile 2");
		expect(profiles[1].settings().all()).toEqual({
			...baseSettings,
			AVATAR: expect.stringMatching(BASE64_REGEX),
			NAME: "test profile 2",
			THEME: "light",
		});
		expect(profiles[1].usesPassword()).toBe(false);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not be able to create new profile if name already exists", async () => {
		const name = "test profile";
		const profile = env.profiles().create(name);

		const { asFragment, getAllByTestId, getByTestId } = await renderComponent();

		const selectDropdown = getByTestId("SelectDropdown__input");
		fireEvent.change(selectDropdown, { target: { value: "BTC" } });
		fireEvent.click(getByTestId("SelectDropdown__option--0"));

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "t" } });

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: name } });

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(getByTestId("Input__error")).toBeVisible();

		expect(asFragment()).toMatchSnapshot();

		env.profiles().forget(profile.id());
	});

	it("should not be able to create new profile if name consists only of whitespace", async () => {
		const { asFragment, getAllByTestId, getByTestId } = await renderComponent();

		const selectDropdown = getByTestId("SelectDropdown__input");
		fireEvent.change(selectDropdown, { target: { value: "BTC" } });
		fireEvent.click(getByTestId("SelectDropdown__option--0"));

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "t" } });

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "     " } });

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(getByTestId("Input__error")).toBeVisible();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not be able to create new profile if name is too long", async () => {
		const { asFragment, getAllByTestId, getByTestId } = await renderComponent();

		const selectDropdown = getByTestId("SelectDropdown__input");
		fireEvent.change(selectDropdown, { target: { value: "BTC" } });
		fireEvent.click(getByTestId("SelectDropdown__option--0"));

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "t" } });

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "test profile".repeat(10) } });

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(getByTestId("Input__error")).toBeVisible();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should store profile with password", async () => {
		const { asFragment, getAllByTestId, getByTestId } = await renderComponent();

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "test profile 3" } });
		fireEvent.input(getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword.test" } });
		fireEvent.input(getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword.test" } });

		const selectDropdown = getByTestId("SelectDropdown__input");

		await act(async () => {
			fireEvent.change(selectDropdown, { target: { value: "BTC" } });
		});

		fireEvent.click(getByTestId("SelectDropdown__option--0"));

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));
		await act(async () => {
			fireEvent.click(getByTestId("CreateProfile__submit-button"));
		});

		expect(env.profiles().last().usesPassword()).toBe(true);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should fail password confirmation", async () => {
		const { asFragment, getAllByTestId, getByTestId } = await renderComponent();

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "asdasdas" } });

		const selectDropdown = getByTestId("SelectDropdown__input");
		fireEvent.change(selectDropdown, { target: { value: "BTC" } });
		fireEvent.click(getByTestId("SelectDropdown__option--0"));

		fireEvent.change(getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword.test" } });
		fireEvent.change(getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword.wrong" } });

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		fireEvent.input(getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword" } });
		fireEvent.input(getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword" } });

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));

		fireEvent.input(getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword.test" } });
		fireEvent.input(getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword.wrong" } });

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should update the avatar when removing focus from name input", async () => {
		const { asFragment, getAllByTestId, getByTestId } = await renderComponent();

		expect(() => getByTestId("SelectProfileImage__avatar")).toThrow(/^Unable to find an element by/);

		act(() => getAllByTestId("Input")[0].focus());

		await act(async () => {
			fireEvent.input(getAllByTestId("Input")[0], { target: { value: "t" } });
		});

		act(() => getAllByTestId("InputPassword")[0].focus());

		expect(getByTestId("SelectProfileImage__avatar")).toBeTruthy();

		act(() => getAllByTestId("Input")[0].focus());

		await act(async () => {
			fireEvent.input(getAllByTestId("Input")[0], { target: { value: "test profile" } });
		});

		act(() => getAllByTestId("InputPassword")[0].focus());

		expect(getByTestId("SelectProfileImage__avatar")).toBeTruthy();

		expect(asFragment()).toMatchSnapshot();

		act(() => getAllByTestId("Input")[0].focus());

		await act(async () => {
			fireEvent.input(getAllByTestId("Input")[0], { target: { value: "" } });
		});

		act(() => getAllByTestId("InputPassword")[0].focus());

		expect(() => getByTestId("SelectProfileImage__avatar")).toThrow(/^Unable to find an element by/);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not update the uploaded avatar when removing focus from name input", async () => {
		const { asFragment, getAllByTestId, getByTestId } = await renderComponent();

		// Upload avatar image
		await act(async () => {
			fireEvent.click(getByTestId("SelectProfileImage__upload-button"));
		});

		expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters);

		act(() => getAllByTestId("Input")[0].focus());

		await act(async () => {
			fireEvent.input(getAllByTestId("Input")[0], { target: { value: "" } });
		});

		act(() => getAllByTestId("InputPassword")[1].focus());

		expect(getByTestId("SelectProfileImage__avatar")).toBeTruthy();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should upload and remove avatar image", async () => {
		const { asFragment, getAllByTestId, getByTestId } = await renderComponent();

		// Upload avatar image
		await act(async () => {
			fireEvent.click(getByTestId("SelectProfileImage__upload-button"));
		});

		expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters);

		await act(async () => {
			fireEvent.click(getByTestId("SelectProfileImage__remove-button"));
		});

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "test profile 4" } });

		const selectDropdown = getByTestId("SelectDropdown__input");

		await act(async () => {
			fireEvent.change(selectDropdown, { target: { value: "BTC" } });
		});

		fireEvent.click(getByTestId("SelectDropdown__option--0"));

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));

		await act(async () => {
			fireEvent.click(getByTestId("CreateProfile__submit-button"));
		});

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not upload avatar image", async () => {
		const { asFragment, getAllByTestId, getByTestId } = await renderComponent();

		// Not upload avatar image
		showOpenDialogMock = jest.spyOn(electron.remote.dialog, "showOpenDialog").mockImplementation(() => ({
			filePaths: undefined,
		}));

		await act(async () => {
			fireEvent.click(getByTestId("SelectProfileImage__upload-button"));
		});

		expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters);

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "test profile 5" } });

		const selectDropdown = getByTestId("SelectDropdown__input");

		await act(async () => {
			fireEvent.change(selectDropdown, { target: { value: "BTC" } });
		});

		fireEvent.click(getByTestId("SelectDropdown__option--0"));

		await act(async () => {
			fireEvent.click(getByTestId("CreateProfile__submit-button"));
		});

		expect(asFragment()).toMatchSnapshot();
	});

	it.each([true, false])("should set dark mode toggle based on system preferences", async (shouldUseDarkColors) => {
		const shouldUseDarkColorsSpy = jest.spyOn(utils, "shouldUseDarkColors").mockReturnValue(shouldUseDarkColors);

		const { container } = await renderComponent();

		const toggle = container.querySelector("input[name=isDarkMode]");

		if (shouldUseDarkColors) {
			expect(toggle).toBeChecked();
		} else {
			expect(toggle).not.toBeChecked();
		}

		expect(document.body).toHaveClass(`theme-${shouldUseDarkColors ? "dark" : "light"}`);

		shouldUseDarkColorsSpy.mockRestore();
	});
});
