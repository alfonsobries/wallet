import { Page } from "app/components/Layout";
import { useActiveProfile, useQueryParams } from "app/hooks";
import { PluginImage } from "domains/plugin/components/PluginImage";
import { LaunchRender, usePluginManagerContext } from "plugins";
import React from "react";

export const PluginView = () => {
	const queryParameters = useQueryParams();

	const profile = useActiveProfile();
	const { pluginManager } = usePluginManagerContext();

	const pluginId = queryParameters.get("pluginId")!;
	const plugin = pluginManager.plugins().findById(pluginId);

	/* istanbul ignore next */
	if (!plugin) {
		return <></>;
	}

	return (
		<Page profile={profile}>
			<div className="py-4 px-4 sm:px-6 lg:px-10">
				<div className="flex justify-between items-center">
					<div className="flex items-center space-x-3">
						<PluginImage
							size="xs"
							logoURL={plugin.config().logo()}
							isExchange={plugin.config().category() === "exchange"}
						/>

						<div className="flex space-x-10 divide-x divide-theme-secondary-300 dark:divide-theme-secondary-700">
							<dl>
								<dd className="font-semibold text-theme-secondary-text dark:text-theme-text">
									{plugin.config().title()}
								</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>

			<div className="flex relative flex-1 w-full h-full">
				<LaunchRender
					manager={pluginManager}
					pluginId={pluginId}
					fallback={<h1>Plugin not loaded or enabled</h1>}
				/>
			</div>
		</Page>
	);
};
