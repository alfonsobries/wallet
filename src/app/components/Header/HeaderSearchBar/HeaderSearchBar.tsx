import { ControlButton } from "app/components/ControlButton";
import { Icon } from "app/components/Icon";
import { Input } from "app/components/Input";
import { clickOutsideHandler, useDebounce } from "app/hooks";
import cn from "classnames";
import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { styled } from "twin.macro";

interface HeaderSearchBarProperties {
	offsetClassName?: string;
	placeholder?: string;
	label?: string;
	noToggleBorder?: boolean;
	onSearch?: (query: string) => void;
	onReset?: () => void;
	extra?: React.ReactNode;
	debounceTimeout?: number;
	defaultQuery?: string;
	resetFields?: boolean;
}

const SearchBarInputWrapper = styled.div`
	min-width: 28rem;
`;

export const HeaderSearchBar = ({
	offsetClassName,
	placeholder,
	label,
	noToggleBorder,
	onSearch,
	extra,
	onReset,
	defaultQuery = "",
	debounceTimeout = 500,
	resetFields = false,
}: HeaderSearchBarProperties) => {
	const { t } = useTranslation();

	const [searchbarVisible, setSearchbarVisible] = useState(false);
	const [query, setQuery] = useState(defaultQuery);

	const reference = useRef(null);
	useEffect(() => clickOutsideHandler(reference, () => setSearchbarVisible(false)), [reference]);

	const debouncedQuery = useDebounce(query, debounceTimeout);
	useEffect(() => onSearch?.(debouncedQuery), [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleQueryReset = useCallback(() => {
		setQuery("");
		onReset?.();
	}, [onReset]);

	useEffect(() => {
		if (resetFields) {
			handleQueryReset();
		}
	}, [resetFields, handleQueryReset]);

	return (
		<div data-testid="HeaderSearchBar" className="relative">
			<ControlButton isChanged={!!query} noBorder={noToggleBorder} onClick={() => setSearchbarVisible(true)}>
				<div className="flex items-center space-x-3 h-5">
					<span>{label}</span>
					<Icon name="Search" size="lg" />
				</div>
			</ControlButton>

			{searchbarVisible && (
				<SearchBarInputWrapper
					data-testid="HeaderSearchBar__input"
					ref={reference}
					className={cn(
						"absolute z-20 flex items-center text-base px-10 -mx-10 py-4 rounded-md shadow-xl bg-theme-background transform",
						offsetClassName || "top-1/2 -translate-y-1/2",
						{
							"right-0": noToggleBorder,
							"right-3": !noToggleBorder,
						},
					)}
				>
					{extra && (
						<div className="flex items-center">
							<div>{extra}</div>
							<div className="mr-8 h-10 border-l border-theme-secondary-300 dark:border-theme-secondary-800" />
						</div>
					)}

					<button
						data-testid="header-search-bar__reset"
						className="focus:outline-none"
						onClick={handleQueryReset}
						type="button"
					>
						<Icon
							className="p-1 -ml-1 text-theme-secondary dark:text-theme-secondary-600 hover:text-theme-primary-600"
							name="CrossSlim"
							size="sm"
						/>
					</button>

					<div className="flex-1">
						<Input
							className="pl-3"
							placeholder={placeholder || `${t("COMMON.SEARCH")}...`}
							value={query}
							isFocused
							ignoreContext
							onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
							noBorder
							noShadow
						/>
					</div>

					<Icon className="text-color-primary-300 dark:text-theme-secondary-600" name="Search" size="lg" />
				</SearchBarInputWrapper>
			)}
		</div>
	);
};

HeaderSearchBar.defaultProps = {
	label: "Search",
};
