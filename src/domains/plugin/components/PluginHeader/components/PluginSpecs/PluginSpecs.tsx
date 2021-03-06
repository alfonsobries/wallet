import { Link } from "app/components/Link";
import { Skeleton } from "app/components/Skeleton";
// @ts-ignore
import extractDomain from "extract-domain";
import React from "react";
import { useTranslation } from "react-i18next";

interface Properties {
	author?: string;
	category?: string;
	url?: string;
	version?: string;
	size?: string;
	logo?: string;
	isLoadingSize?: boolean;
}

interface GridColProperties {
	children: React.ReactNode;
	padding?: string;
}

interface GridItemProperties {
	label: string;
	children: React.ReactNode;
	textDirection?: string;
}

const GridItem = ({ label, children, textDirection }: GridItemProperties) => (
	<div className={`flex flex-col ${textDirection && `text-${textDirection}`}`}>
		<span className="text-sm font-semibold text-theme-secondary-500 dark:text-theme-secondary-700">{label}</span>
		<span className="font-semibold text-theme-secondary-text">{children}</span>
	</div>
);

const GridCol = ({ children, padding }: GridColProperties) => {
	const mountClassName = () => {
		let styles = "flex";

		if (padding) {
			styles = `${styles} ${padding}`;
		}

		return styles;
	};

	return <div className={mountClassName()}>{children}</div>;
};

export const PluginSpecs = ({ author, category, url, version, size, isLoadingSize }: Properties) => {
	const domain = url && extractDomain(url);
	const { t } = useTranslation();

	return (
		<div className="flex justify-between space-4">
			<div className="flex space-x-8 divide-x divide-theme-secondary-300 dark:divide-theme-secondary-800">
				<GridCol>
					<GridItem label={t("COMMON.AUTHOR")}>
						<span className="font-semibold text-theme-secondary-text">{author}</span>
					</GridItem>
				</GridCol>

				<GridCol padding="pl-8">
					<GridItem label={t("COMMON.CATEGORY")}>
						{t(`PLUGINS.CATEGORIES.${category?.toUpperCase()}`)}
					</GridItem>
				</GridCol>

				<GridCol padding="pl-8">
					<GridItem label={t("COMMON.URL")}>
						{domain ? (
							<Link data-testid="PluginSpecs__url" to={url} isExternal>
								{domain}
							</Link>
						) : (
							"N/A"
						)}
					</GridItem>
				</GridCol>
			</div>

			<div className="flex space-x-8 divide-x divide-theme-secondary-300 dark:divide-theme-secondary-800">
				<GridCol padding="pl-8">
					<GridItem label={t("COMMON.SIZE")} textDirection="right">
						{isLoadingSize ? (
							<span data-testid="PluginSpecs__size-skeleton">
								<Skeleton width={60} height={20} className="mt-0.5" />
							</span>
						) : (
							<span data-testid="PluginSpecs__size">{size || "N/A"}</span>
						)}
					</GridItem>
				</GridCol>

				<GridCol padding="pl-8">
					<GridItem label={t("COMMON.VERSION")} textDirection="right">
						{version!}
					</GridItem>
				</GridCol>
			</div>
		</div>
	);
};
