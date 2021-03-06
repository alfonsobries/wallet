import { Contracts } from "@payvo/profiles";
// @README: This import is fine in tests but should be avoided in production code.
import { ReadOnlyWallet } from "@payvo/profiles/distribution/read-only-wallet";
import { translations } from "app/i18n/common/i18n";
import React from "react";
import { act, fireEvent, render } from "testing-library";
import { data } from "tests/fixtures/coins/ark/devnet/delegates.json";

import { DelegateRow } from "./DelegateRow";

let delegate: Contracts.IReadOnlyWallet;

describe("DelegateRow", () => {
	beforeAll(() => {
		delegate = new ReadOnlyWallet({
			address: data[0].address,
			explorerLink: "",
			isDelegate: true,
			isResignedDelegate: false,
			publicKey: data[0].publicKey,
			username: data[0].username,
		});
	});

	it("should render", () => {
		const { container, asFragment } = render(
			<table>
				<tbody>
					<DelegateRow index={0} delegate={delegate} />
				</tbody>
			</table>,
		);

		expect(container).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should emit action on select button", () => {
		const onSelect = jest.fn();
		const { container, asFragment, getByTestId } = render(
			<table>
				<tbody>
					<DelegateRow index={0} delegate={delegate} onVoteSelect={onSelect} />
				</tbody>
			</table>,
		);
		const selectButton = getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(container).toBeTruthy();
		expect(onSelect).toHaveBeenCalledWith(delegate.address());
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render the selected delegate", () => {
		const selected = [delegate.address()];
		const { container, asFragment, getByTestId } = render(
			<table>
				<tbody>
					<DelegateRow index={0} delegate={delegate} selectedVotes={selected} />
				</tbody>
			</table>,
		);

		expect(container).toBeTruthy();
		expect(getByTestId("DelegateRow__toggle-0")).toHaveTextContent(translations.SELECTED);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render the selected vote", () => {
		const secondDelegate = new ReadOnlyWallet({
			address: data[1].address,
			explorerLink: "",
			isDelegate: true,
			isResignedDelegate: false,
			publicKey: data[1].publicKey,
			username: data[1].username,
		});

		const thirdDelegate = new ReadOnlyWallet({
			address: data[2].address,
			explorerLink: "",
			isDelegate: true,
			isResignedDelegate: false,
			publicKey: data[2].publicKey,
			username: data[2].username,
		});

		const { container, asFragment, getByTestId } = render(
			<table>
				<tbody>
					<DelegateRow index={0} delegate={delegate} isVoted={true} />
					<DelegateRow index={1} delegate={secondDelegate} />
					<DelegateRow index={2} delegate={thirdDelegate} isVoteDisabled={true} />
				</tbody>
			</table>,
		);

		expect(container).toBeTruthy();
		expect(getByTestId("DelegateRow__toggle-0")).toHaveTextContent(translations.CURRENT);
		expect(getByTestId("DelegateRow__toggle-1")).toHaveTextContent(translations.SELECT);
		expect(getByTestId("DelegateRow__toggle-2")).toBeDisabled();

		expect(asFragment()).toMatchSnapshot();
	});
});
