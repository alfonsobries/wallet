/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/profiles";
import React from "react";
import {
	act,
	env,
	fireEvent,
	getDefaultPassword,
	getPasswordProtectedProfileId,
	renderWithRouter,
	waitFor,
} from "utils/testing-library";

import { translations } from "../../i18n";
import { SignIn } from "./SignIn";

let profile: Contracts.IProfile;

jest.setTimeout(30_000);

describe("SignIn", () => {
	beforeEach(async () => {
		profile = env.profiles().findById(getPasswordProtectedProfileId());
		await env.profiles().restore(profile, getDefaultPassword());
	});

	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	it("should not render if not open", () => {
		const { asFragment, getByTestId } = renderWithRouter(<SignIn profile={profile} isOpen={false} />);

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal", async () => {
		let renderContext: any;

		await act(async () => {
			renderContext = renderWithRouter(<SignIn isOpen={true} profile={profile} />);
		});

		const { asFragment, getByTestId } = renderContext;

		expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SIGN_IN.TITLE);
		expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SIGN_IN.DESCRIPTION);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should cancel sign in", async () => {
		const onCancel = jest.fn();

		const { getByTestId } = renderWithRouter(<SignIn isOpen={true} profile={profile} onCancel={onCancel} />);

		act(() => {
			fireEvent.click(getByTestId("SignIn__cancel-button"));
		});

		await waitFor(() => {
			expect(onCancel).toBeCalled();
		});
	});

	it("should call onSuccess callback", async () => {
		const onSuccess = jest.fn();

		const { findByTestId, getByTestId } = renderWithRouter(
			<SignIn isOpen={true} profile={profile} onSuccess={onSuccess} />,
		);

		await act(async () => {
			fireEvent.input(getByTestId("SignIn__input--password"), { target: { value: getDefaultPassword() } });
		});

		// wait for formState.isValid to be updated
		await findByTestId("SignIn__submit-button");

		act(() => {
			fireEvent.click(getByTestId("SignIn__submit-button"));
		});

		await waitFor(() => {
			expect(onSuccess).toBeCalled();
		});
	});

	it("should set an error if the password is invalid", async () => {
		const onSuccess = jest.fn();

		const { findByTestId, getByTestId } = renderWithRouter(
			<SignIn isOpen={true} profile={profile} onSuccess={onSuccess} />,
		);

		await act(async () => {
			fireEvent.input(getByTestId("SignIn__input--password"), { target: { value: "wrong password" } });
		});

		// wait for formState.isValid to be updated
		await findByTestId("SignIn__submit-button");

		act(() => {
			fireEvent.click(getByTestId("SignIn__submit-button"));
		});

		// wait for formState.isValid to be updated
		await findByTestId("SignIn__submit-button");

		expect(getByTestId("Input__error")).toBeVisible();
		expect(getByTestId("SignIn__submit-button")).toBeDisabled();
	});

	it("should set an error and disable the input if the password is invalid multiple times", async () => {
		const onSuccess = jest.fn();

		let renderContext: any;

		await act(async () => {
			renderContext = renderWithRouter(<SignIn isOpen={true} profile={profile} onSuccess={onSuccess} />);
		});

		const { findByTestId, getByTestId } = renderContext;

		for (const index of [1, 2, 3]) {
			await act(async () => {
				fireEvent.input(getByTestId("SignIn__input--password"), {
					target: { value: `wrong password ${index}` },
				});
			});

			// wait for form to be updated
			await findByTestId("SignIn__submit-button");

			act(() => {
				fireEvent.click(getByTestId("SignIn__submit-button"));
			});

			// wait for form to be updated
			await findByTestId("SignIn__submit-button");
		}

		expect(getByTestId("SignIn__submit-button")).toBeDisabled();
		expect(getByTestId("SignIn__input--password")).toBeDisabled();

		act(() => {
			jest.advanceTimersByTime(65_000);
			jest.clearAllTimers();
		});

		// wait for form to be updated
		await findByTestId("SignIn__submit-button");

		await waitFor(() => expect(getByTestId("Input__error")).toHaveAttribute("data-errortext", "Password invalid"), {
			timeout: 10_000,
		});
	});
});
