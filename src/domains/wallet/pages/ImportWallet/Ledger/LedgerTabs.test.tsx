import Transport from "@ledgerhq/hw-transport";
import { createTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { Contracts } from "@payvo/profiles";
import { LedgerProvider } from "app/contexts";
import nock from "nock";
import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Route } from "react-router-dom";
import { act, env, fireEvent, getDefaultProfileId, renderWithRouter, screen, waitFor } from "utils/testing-library";

import { LedgerTabs } from "./LedgerTabs";

jest.setTimeout(20_000);

describe("LedgerTabs", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;
	let transport: typeof Transport;
	let publicKeyPaths = new Map();
	let onClickEditWalletName: jest.Mock;

	beforeAll(() => {
		nock("https://ark-test.payvo.com/api")
			.get("/wallets")
			.query((parameters) => !!parameters.address)
			.reply(200, {
				data: [
					{
						address: "DJpFwW39QnQvQRQJF2MCfAoKvsX4DJ28jq",
						balance: "2",
					},
					{
						address: "DSyG9hK9CE8eyfddUoEvsga4kNVQLdw2ve",
						balance: "3",
					},
				],
				meta: {},
			})
			.get("/wallets")
			.query((parameters) => !!parameters.address)
			.reply(200, {
				data: [],
				meta: {},
			})
			.get("/wallets")
			.query((parameters) => !!parameters.address)
			.reply(200, {
				data: [],
				meta: {},
			});
	});

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		await env.profiles().restore(profile);
		await profile.sync();

		wallet = profile.wallets().first();
		await wallet.synchroniser().identity();

		onClickEditWalletName = jest.fn();

		transport = createTransportReplayer(RecordStore.fromString(""));
		publicKeyPaths = new Map([
			["44'/1'/0'/0/0", "027716e659220085e41389efc7cf6a05f7f7c659cf3db9126caabce6cda9156582"],
			["44'/1'/0'/0/1", "03d3fdad9c5b25bf8880e6b519eb3611a5c0b31adebc8455f0e096175b28321aff"],
			["44'/1'/0'/0/2", "025f81956d5826bad7d30daed2b5c8c98e72046c1ec8323da336445476183fb7ca"],
			["44'/1'/0'/0/3", "024d5eacc5e05e1b05c476b367b7d072857826d9b271e07d3a3327224db8892a21"],
			["44'/1'/0'/0/4", "025d7298a7a472b1435e40df13491e98609b9b555bf3ef452b2afea27061d11235"],

			["44'/1'/1'/0/0", wallet.publicKey()!],
			["44'/1'/2'/0/0", "020aac4ec02d47d306b394b79d3351c56c1253cd67fe2c1a38ceba59b896d584d1"],
			["44'/1'/3'/0/0", "033a5474f68f92f254691e93c06a2f22efaf7d66b543a53efcece021819653a200"],
			["44'/1'/4'/0/0", "03d3c6889608074b44155ad2e6577c3368e27e6e129c457418eb3e5ed029544e8d"],
		]);

		jest.spyOn(transport, "listen").mockImplementationOnce(() => ({ unsubscribe: jest.fn() }));

		jest.spyOn(wallet.coin(), "__construct").mockImplementation();
		jest.spyOn(wallet.coin().ledger(), "getExtendedPublicKey").mockResolvedValue(wallet.publicKey()!);

		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	const BaseComponent = ({ activeIndex }: { activeIndex: number }) => (
		<Route path="/profiles/:profileId">
			<LedgerProvider transport={transport}>
				<LedgerTabs activeIndex={activeIndex} onClickEditWalletName={onClickEditWalletName} />
			</LedgerProvider>
		</Route>
	);

	const nextSelector = () => screen.getByTestId("Paginator__continue-button");
	const backSelector = () => screen.getByTestId("Paginator__back-button");

	it("should render connection step", async () => {
		const getPublicKeySpy = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockRejectedValue(new Error("Failed"));

		let formReference: ReturnType<typeof useForm>;
		const Component = () => {
			const form = useForm({ mode: "onChange" });
			const { register } = form;

			useEffect(() => {
				register("network", { required: true });
			}, [register]);

			formReference = form;

			return (
				<FormProvider {...form}>
					<BaseComponent activeIndex={1} />
				</FormProvider>
			);
		};

		const { container, history } = renderWithRouter(<Component />, { routes: [`/profiles/${profile.id()}`] });

		await waitFor(() => expect(screen.getByTestId("SelectNetwork")).toBeInTheDocument());
		await waitFor(() => expect(nextSelector()).toBeDisabled());
		await waitFor(() => expect(backSelector()).toBeEnabled());

		formReference!.setValue("network", wallet.network(), { shouldDirty: true, shouldValidate: true });

		expect(container).toMatchSnapshot();

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		act(() => {
			fireEvent.click(backSelector());
		});

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/dashboard`);

		historySpy.mockRestore();

		await waitFor(() => expect(nextSelector()).toBeEnabled());

		act(() => {
			fireEvent.click(nextSelector());
		});

		await waitFor(() => expect(screen.getByTestId("LedgerConnectionStep")).toBeInTheDocument());
		await waitFor(() => expect(screen.queryByText("Failed")).toBeInTheDocument(), { timeout: 10_000 });

		act(() => {
			fireEvent.click(backSelector());
		});

		await waitFor(() => expect(screen.getByTestId("SelectNetwork")).toBeInTheDocument());
		await waitFor(() => expect(nextSelector()).toBeEnabled());

		getPublicKeySpy.mockReset();
	});

	it("should render scan step", async () => {
		const getPublicKeySpy = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockImplementation((path) => Promise.resolve(publicKeyPaths.get(path)!));

		const Component = () => {
			const form = useForm({
				defaultValues: {
					network: wallet.network(),
				},
				mode: "onChange",
			});

			const { register } = form;

			useEffect(() => {
				register("network");
			}, [register]);

			return (
				<FormProvider {...form}>
					<BaseComponent activeIndex={2} />
				</FormProvider>
			);
		};

		renderWithRouter(<Component />, { routes: [`/profiles/${profile.id()}`] });

		await waitFor(() => expect(screen.getByTestId("LedgerConnectionStep")).toBeInTheDocument());

		// Auto redirect to next step
		await waitFor(() => expect(screen.getByTestId("LedgerScanStep")).toBeInTheDocument());
		await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(6), { timeout: 3000 });

		await waitFor(() => expect(screen.getAllByRole("checkbox")).toHaveLength(3));

		getPublicKeySpy.mockReset();
	});

	it("should redirect to first screen when clicking back", async () => {
		const getPublicKeySpy = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockImplementation((path) => Promise.resolve(publicKeyPaths.get(path)!));

		const Component = () => {
			const form = useForm({
				defaultValues: {
					network: wallet.network(),
				},
				mode: "onChange",
			});

			const { register } = form;

			useEffect(() => {
				register("network");
			}, [register]);

			return (
				<FormProvider {...form}>
					<BaseComponent activeIndex={2} />
				</FormProvider>
			);
		};

		renderWithRouter(<Component />, { routes: [`/profiles/${profile.id()}`] });

		await waitFor(() => expect(screen.getByTestId("LedgerConnectionStep")).toBeInTheDocument());

		// Auto redirect to next step
		await waitFor(() => expect(screen.getByTestId("LedgerScanStep")).toBeInTheDocument());

		act(() => {
			fireEvent.click(backSelector());
		});

		await waitFor(() => expect(screen.getByTestId("SelectNetwork")).toBeInTheDocument());
		await waitFor(() => expect(nextSelector()).toBeEnabled());

		getPublicKeySpy.mockReset();
	});

	it("should render finish step", async () => {
		const getPublicKeySpy = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockImplementation((path) => Promise.resolve(publicKeyPaths.get(path)!));

		const Component = () => {
			const form = useForm({
				defaultValues: {
					network: wallet.network(),
				},
				mode: "onChange",
			});

			const { register } = form;

			useEffect(() => {
				register("network");
			}, [register]);

			return (
				<FormProvider {...form}>
					<BaseComponent activeIndex={3} />
				</FormProvider>
			);
		};

		renderWithRouter(<Component />, { routes: [`/profiles/${profile.id()}`] });

		await waitFor(() => expect(screen.getByTestId("LedgerScanStep")).toBeInTheDocument());
		await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(3), { timeout: 3000 });

		expect(profile.wallets().values()).toHaveLength(2);

		await waitFor(() => expect(screen.getAllByRole("checkbox")).toHaveLength(3));

		act(() => {
			fireEvent.click(nextSelector());
		});

		await waitFor(() => expect(screen.getByTestId("LedgerImportStep")).toBeInTheDocument(), { timeout: 10_000 });

		// Import wallets before entering the last step
		expect(profile.wallets().values()).toHaveLength(4);

		// First address
		fireEvent.click(screen.getAllByTestId("LedgerImportStep__edit-alias")[1]);

		expect(onClickEditWalletName).toHaveBeenCalledTimes(1);

		getPublicKeySpy.mockReset();
	});

	it("should render scan step with failing fetch", async () => {
		jest.spyOn(wallet.ledger(), "scan").mockRejectedValue(new Error("Scan Failed"));

		const getPublicKeySpy = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockImplementation((path) => Promise.resolve(publicKeyPaths.get(path)!));

		const Component = () => {
			const form = useForm({
				defaultValues: {
					network: wallet.network(),
				},
				mode: "onChange",
			});

			const { register } = form;

			useEffect(() => {
				register("network");
			}, [register]);

			return (
				<FormProvider {...form}>
					<BaseComponent activeIndex={2} />
				</FormProvider>
			);
		};

		const { container } = renderWithRouter(<Component />, { routes: [`/profiles/${profile.id()}`] });

		await waitFor(() => expect(screen.getByTestId("LedgerConnectionStep")).toBeInTheDocument());

		// Auto redirect to next step
		await waitFor(() => expect(screen.getByTestId("LedgerScanStep")).toBeInTheDocument());
		await waitFor(() => expect(screen.getByTestId("LedgerScanStep__error")).toBeInTheDocument());

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__retry-button"));
		});

		await waitFor(() => expect(screen.queryAllByTestId("LedgerScanStep__amount-skeleton")).toHaveLength(0), {
			interval: 5,
		});
		await waitFor(() => expect(screen.getByTestId("LedgerScanStep__error")).toBeInTheDocument());

		expect(container).toMatchSnapshot();

		act(() => {
			fireEvent.click(backSelector());
		});

		await waitFor(() => expect(screen.getByTestId("SelectNetwork")).toBeInTheDocument());

		getPublicKeySpy.mockReset();
	});
});
