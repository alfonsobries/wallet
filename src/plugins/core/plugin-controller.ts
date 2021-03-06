import { Contracts } from "@payvo/profiles";

import { PluginAPI } from "../types";
import { PluginConfigurationData } from "./configuration";
import { applyPluginMiddlewares, isPluginEnabled, PluginHooks } from "./internals";
import { container } from "./plugin-container";

type Callback = (api: PluginAPI) => void;

export class PluginController {
	#hooks: PluginHooks;

	#config: PluginConfigurationData;
	#callback: Callback;
	#dir: string | undefined;

	constructor(config: Record<string, any>, callback: Callback, dir?: string) {
		this.#hooks = new PluginHooks();
		this.#dir = dir;
		this.#config = PluginConfigurationData.make(config, dir);
		this.#callback = callback;
	}

	hooks() {
		return this.#hooks;
	}

	dir() {
		return this.#dir;
	}

	config() {
		return this.#config;
	}

	isEnabled(profile: Contracts.IProfile) {
		return !!this.pluginData(profile);
	}

	// TODO: Better integration with SDK
	enable(profile: Contracts.IProfile, options?: { autoRun?: true }) {
		/* istanbul ignore next */
		if (options?.autoRun) {
			this.run(profile);
		}

		// @ts-ignore
		const { id } = profile.plugins().push({
			isEnabled: true,
			name: this.config().name(),
			permissions: this.config().permissions(),
			urls: this.config().urls(),
			version: this.config().version(),
		});

		return id;
	}

	disable(profile: Contracts.IProfile) {
		if (this.isEnabled(profile)) {
			profile.plugins().forget(this.pluginData(profile)!.id);
			this.dispose();
		}
	}

	run(profile: Contracts.IProfile) {
		const pluginAPI = container.services().api(this, profile);
		const guard = applyPluginMiddlewares({ plugin: this, profile }, [isPluginEnabled]);

		try {
			// @ts-ignore
			const function_ = this.#callback?.default || this.#callback;
			guard(function_?.(pluginAPI));
			this.#hooks.emit("activated");
		} catch (error) {
			console.error(`Failed to run the plugin "${this.config().name()}": ${error.message}`);
			throw error;
		}
	}

	dispose() {
		this.#hooks.clearAll();
		this.#hooks.emit("deactivated");
	}

	private pluginData(profile: Contracts.IProfile) {
		return profile
			.plugins()
			.values()
			.find((item) => item.name === this.config().name());
	}
}
