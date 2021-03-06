import { prettyBytes, startCase, uniq } from "@arkecosystem/utils";
import { Contracts, Repositories } from "@payvo/profiles";
import du from "du";
import parseAuthor from "parse-author";
import semver from "semver";
import { assertString } from "utils/assertions";

import appPackage from "../../../../package.json";
import { allPermissions } from "./permissions";
import { schema } from "./schema";

export class PluginConfigurationData {
	#config: Contracts.IDataRepository;
	#manifest: Contracts.IDataRepository;
	#size = 0;

	constructor(config: Contracts.IDataRepository, manifest: Contracts.IDataRepository) {
		this.#config = config;
		this.#manifest = manifest;
	}

	static make(config: Record<string, any>, dir?: string) {
		const data = new Repositories.DataRepository();
		data.fill(config);

		const manifest = new Repositories.DataRepository();
		const values = data.get<Record<string, any>>("desktop-wallet");

		if (values) {
			manifest.fill(values);
		}

		const plugin = new PluginConfigurationData(data, manifest);

		plugin.syncSize(dir);

		return plugin;
	}

	validate() {
		return schema.validateSync(this.#config.toJSON());
	}

	get<T = string>(key: string, defaultValue?: T) {
		return this.#config.get<T>(key, defaultValue);
	}

	manifest() {
		return this.#manifest;
	}

	name(): string {
		return this.get("name")!;
	}

	id(): string {
		return this.name();
	}

	author() {
		if (this.isOfficial()) {
			return `ARK Ecosystem`;
		}

		const author = this.get<string | { name: string }>("author");
		const contributors = this.get<{ name: string }[] | string[]>("contributors");

		if (author) {
			if (typeof author === "string") {
				return parseAuthor(author).name;
			}
			return author.name;
		}

		if (contributors?.length) {
			// @ts-ignore
			return parseAuthor(contributors?.[0]?.name || contributors?.[0]).name;
		}

		return `Unknown`;
	}

	keywords(): string[] {
		// @ts-ignore
		const keywords: string[] = this.get("keywords", []);

		return uniq(keywords).map((item) => startCase(item) as string);
	}

	categories(): string[] {
		const validCategories = new Set(["gaming", "language", "utility", "exchange", "other"]);
		// @ts-ignore
		const categories: string[] = this.manifest().get("categories", ["other"]);
		const result: string[] = [];

		for (const category of categories) {
			if (validCategories.has(category) && !result.includes(category)) {
				result.push(category);
			}
		}

		return result.length > 0 ? result : ["other"];
	}

	category() {
		return this.categories()[0];
	}

	hasCategory(categoryName: string) {
		return this.categories().includes(categoryName);
	}

	date() {
		return this.get("date");
	}

	description() {
		return this.get("description");
	}

	homepage() {
		return this.get("homepage");
	}

	images() {
		return this.manifest().get<string[]>("images", []);
	}

	permissions() {
		const permissions = this.manifest().get<string[]>("permissions") || [];
		const validPermissions = permissions.filter((permission) => allPermissions.includes(permission.toUpperCase()));
		return uniq(validPermissions.map((permission: string) => permission.toUpperCase()));
	}

	urls() {
		return this.manifest().get<string[]>("urls") || [];
	}

	minimumVersion(): string | undefined {
		return process.env.REACT_APP_PLUGIN_MINIMUM_VERSION ?? this.manifest().get<string>("minimumVersion");
	}

	version() {
		let version = this.get("version");

		if (semver.valid(version)) {
			version = semver.coerce(version)?.version;
			assertString(version);
			return version;
		}

		return "0.0.0";
	}

	logo() {
		let logo: string | undefined;

		logo = this.#config.has("logo") ? this.#config.get("logo") : this.#manifest.get("logo");

		const regex = /(?:ht{2}ps?:)?\/raw\.githubusercontent\.com\/([\w.-]+)\/[\dA-z-].*(\.(jpe?g|png|gif))$/;

		if (logo && regex.test(logo)) {
			return logo;
		}
	}

	size() {
		return prettyBytes(this.#size);
	}

	title() {
		const title = this.manifest().get<string>("title");

		if (title) {
			return startCase(title);
		}

		const name = this.get("name")!;

		const parts = name.split("/");
		const temporary = parts[parts.length > 1 ? 1 : 0];

		return startCase(temporary);
	}

	isOfficial() {
		const name = this.name();

		if (!name) {
			return false;
		}

		const scopeRegex = new RegExp(`^@arkecosystem/`);
		return scopeRegex.test(name);
	}

	url() {
		let url = this.#config.get<{ url: string }>("sourceProvider")?.url; // PSDK registry field

		if (!url) {
			url = this.#config.get<{ url: string }>("repository")?.url;
		}

		if (!url) {
			url = this.#config.get("homepage");
		}

		return url?.replace(/^git\+/, "").replace(/\.git$/, "");
	}

	async syncSize(dir?: string) {
		const dist = this.get<{ unpackedSize: number }>("dist");

		let size = 0;

		if (dist) {
			size = dist.unpackedSize;
		} else if (dir) {
			try {
				size = await du(dir);
			} catch {
				size = 0;
			}
		}

		this.#size = size;
	}

	isCompatible() {
		const minimumVersion = this.minimumVersion();
		const validMinimumVersion = semver.valid(minimumVersion) ? semver.coerce(minimumVersion)!.version : "0.0.0";
		return minimumVersion ? semver.gte(appPackage.version, validMinimumVersion) : true;
	}

	toObject() {
		return {
			author: this.author(),
			categories: this.categories(),
			category: this.categories()[0],
			date: this.date(),
			description: this.description(),
			homepage: this.homepage(),
			id: this.id(),
			images: this.images(),
			isCompatible: this.isCompatible(),
			isOfficial: this.isOfficial(),
			logo: this.logo(),
			minimumVersion: this.minimumVersion(),
			name: this.name(),
			permissions: this.permissions(),
			size: this.size(),
			title: this.title(),
			url: this.url(),
			version: this.version(),
		};
	}
}
