import { CircularProgressBar } from "app/components/CircularProgressBar";
import { Icon } from "app/components/Icon";
import React from "react";

import { LoaderWrapper, LogoSpinner } from "./Loader.styles";

interface LoaderProperties {
	show?: boolean;
}

export const Loader = ({ show }: LoaderProperties) => {
	if (!show) {
		return <></>;
	}

	return (
		<LoaderWrapper>
			<LogoSpinner>
				<div className="centered">
					<CircularProgressBar
						className="spin"
						showValue={false}
						size={100}
						strokeWidth={3}
						value={40}
						progressColor="var(--theme-color-secondary-800)"
						strokeColor="var(--theme-color-secondary-300)"
					/>
				</div>

				<div className="centered">
					<CircularProgressBar
						className="spin left"
						showValue={false}
						size={75}
						strokeWidth={3}
						value={30}
						progressColor="var(--theme-color-secondary-800)"
						strokeColor="var(--theme-color-secondary-300)"
					/>
				</div>

				<div className="centered">
					<Icon name="LoaderLogo" size="xl" />
				</div>
			</LogoSpinner>
		</LoaderWrapper>
	);
};

Loader.defaultProps = {
	show: true,
};
