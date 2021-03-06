import resolve from "enhanced-resolve";
import fs from "fs";
import { glob } from "glob";
import path from "path";

import { validatePath } from "../../../utils/validate-path";
import { PluginRawInstance } from "../../types";
import * as loaderIpc from "./loader-fs-ipc";

export class PluginLoaderFileSystem {
	#roots: string[];

	constructor(paths: string[]) {
		this.#roots = paths;
	}

	static ipc() {
		return loaderIpc;
	}

	remove(dir: string) {
		const fsExtra = require("fs-extra");
		const isValid = this.#roots.some((root) => validatePath(root, dir));

		if (!isValid) {
			return Promise.reject(`The dir ${dir} cannot be removed.`);
		}

		return fsExtra.remove(dir);
	}

	search(): PluginRawInstance[] {
		const paths = this.findPathsByConfigFiles();
		const entries: PluginRawInstance[] = [];

		for (const dir of paths) {
			try {
				const result = this.find(dir);
				entries.push(result!);
			} catch {
				continue;
			}
		}

		return entries;
	}

	find(dir: string) {
		const configPath = path.join(dir, "package.json");
		const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

		let sourcePath: string | false;

		try {
			sourcePath = resolve.sync(dir, ".");
		} catch {
			sourcePath = resolve.sync(dir, "./src");
		}

		/* istanbul ignore next */
		if (sourcePath) {
			const source = fs.readFileSync(sourcePath, "utf-8");

			return {
				config,
				dir,
				source,
				sourcePath,
			};
		}
	}

	private findPathsByConfigFiles() {
		const files: string[] = [];

		for (const cwd of this.#roots) {
			const match = glob.sync("**/package.json", {
				absolute: true,
				cwd,
				ignore: "**/node_modules/**/*",
				matchBase: true,
				nodir: true,
			});

			files.push(...match);
		}

		return files.map((file) => path.dirname(file));
	}
}
