import { BigNumber } from "@payvo/helpers";
import { createMemoryHistory } from "history";
import React from "react";
import { getDefaultProfileId, render } from "testing-library";
import { TransactionFixture } from "tests/fixtures/transactions";

import { translations } from "../../i18n";
import { TransferDetail } from "./TransferDetail";

const history = createMemoryHistory();

const fixtureProfileId = getDefaultProfileId();
let dashboardURL: string;

beforeEach(() => {
	dashboardURL = `/profiles/${fixtureProfileId}/dashboard`;
	history.push(dashboardURL);
});

describe("TransferDetail", () => {
	it("should not render if not open", () => {
		const { asFragment, getByTestId } = render(
			<TransferDetail
				isOpen={false}
				transaction={{ ...TransactionFixture, blockId: () => "adsad12312xsd1w312e1s13203e12" }}
				ticker="BTC"
			/>,
		);

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal", () => {
		const { asFragment, getByTestId } = render(
			<TransferDetail
				isOpen={true}
				transaction={{ ...TransactionFixture, blockId: () => "adsad12312xsd1w312e1s13203e12" }}
				ticker="BTC"
			/>,
		);

		expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_TRANSFER_DETAIL.TITLE);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render as confirmed", () => {
		const { asFragment, getByText, getByTestId } = render(
			<TransferDetail
				isOpen={true}
				transaction={{
					...TransactionFixture,
					blockId: () => "adsad12312xsd1w312e1s13203e12",
					confirmations: () => BigNumber.ONE,
					isConfirmed: () => true,
				}}
				ticker="BTC"
			/>,
		);

		expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_TRANSFER_DETAIL.TITLE);
		expect(getByText("Well confirmed")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render as not is sent", () => {
		const { asFragment, getByTestId } = render(
			<TransferDetail
				isOpen={true}
				transaction={{
					...TransactionFixture,
					blockId: () => "adsad12312xsd1w312e1s13203e12",
					isSent: () => false,
				}}
				ticker="BTC"
			/>,
		);

		expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_TRANSFER_DETAIL.TITLE);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with wallet alias", () => {
		const { asFragment, getByTestId } = render(
			<TransferDetail
				isOpen={true}
				transaction={{
					...TransactionFixture,
					blockId: () => "adsad12312xsd1w312e1s13203e12",
					isSent: () => false,
				}}
				walletAlias="D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD"
				ticker="BTC"
			/>,
		);

		expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_TRANSFER_DETAIL.TITLE);
		expect(asFragment()).toMatchSnapshot();
	});
});
