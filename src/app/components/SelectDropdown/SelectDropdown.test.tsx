import { act } from "@testing-library/react-hooks";
import React, { useState } from "react";
import { fireEvent, render, screen, waitFor } from "testing-library";

import { Select } from "./SelectDropdown";

enum OptionType {
	base = "base",
	group = "group",
}

const options = [
	{
		label: "Option 1",
		value: "1",
	},
	{
		label: "Option 2",
		value: "2",
	},
	{
		label: "Option 3",
		value: "3",
	},
];

const optionGroup = [
	{
		options: [
			{
				label: "Option 1",
				value: "1",
			},
			{
				label: "Option 2",
				value: "2",
			},
		],
		title: "Group1",
	},
	{
		options: [
			{
				label: "Item 1",
				value: "3",
			},
			{
				label: "Item 2",
				value: "4",
			},
		],
		title: "Group2",
	},
];

const getOptions = (optType: OptionType) => {
	if (optType === OptionType.base) {
		return options;
	}

	return optionGroup;
};

describe("SelectDropdown", () => {
	it.each([OptionType.base, OptionType.group])("should render option %s", (optType) => {
		const { container } = render(<Select options={getOptions(optType)} />);

		expect(container).toMatchSnapshot();
	});

	it.each([OptionType.base, OptionType.group])("should render option %s with custom label", (optType) => {
		const { container, queryByText, getByTestId } = render(
			<Select options={getOptions(optType)} renderLabel={(option) => <span>{`Label ${option.label}`}</span>} />,
		);

		fireEvent.focus(getByTestId("SelectDropdown__input"), { target: { value: "Opt" } });

		expect(container).toMatchSnapshot();
		expect(queryByText("Label Option 1")).toBeInTheDocument();
	});

	it.each([OptionType.base, OptionType.group])("should render invalid option %s", (optType) => {
		const { container } = render(<Select options={getOptions(optType)} isInvalid />);

		expect(container).toMatchSnapshot();
	});

	it.each([OptionType.base, OptionType.group])("should render disabled option %s", (optType) => {
		const { container } = render(<Select options={getOptions(optType)} disabled />);

		expect(container).toMatchSnapshot();
	});

	it.each([OptionType.base, OptionType.group])("should render option %s without caret", (optType) => {
		const { container } = render(<Select options={getOptions(optType)} showCaret={false} />);

		expect(container).toMatchSnapshot();
	});

	it.each([OptionType.base, OptionType.group])(
		"should trigger menu when clicking on caret in option %s",
		async (optType) => {
			render(<Select options={getOptions(optType)} showCaret />);

			fireEvent.click(screen.getByTestId("SelectDropdown__caret"));

			await waitFor(() => expect(screen.getByTestId("SelectDropdown__option--0")).toBeInTheDocument());

			fireEvent.click(screen.getByTestId("SelectDropdown__caret"));

			await waitFor(() => expect(screen.queryByTestId("SelectDropdown__option--0")).not.toBeInTheDocument());
		},
	);

	it.each([OptionType.base, OptionType.group])("should render option %s with initial default value", (optType) => {
		const { container } = render(<Select options={getOptions(optType)} defaultValue="3" />);

		expect(container).toMatchSnapshot();
	});

	it.each([OptionType.base, OptionType.group])("should render option %s with wrong default value", (optType) => {
		const { container } = render(<Select options={getOptions(optType)} defaultValue="5" />);

		expect(container).toMatchSnapshot();
	});

	it("should render with empty options", () => {
		const { container } = render(<Select options={[]} defaultValue="4" />);

		expect(container).toMatchSnapshot();
	});

	it("should render with options values as numbers", () => {
		const { container } = render(<Select options={[{ label: "Value 1", value: 1 }]} defaultValue="4" />);

		expect(container).toMatchSnapshot();
	});

	it.each([OptionType.base, OptionType.group])("should toggle select list options %s", (optType) => {
		const { getByTestId } = render(<Select options={getOptions(optType)} />);

		const selectDropdown = getByTestId("SelectDropdown__input");

		act(() => {
			fireEvent.change(selectDropdown, { target: { value: "Opt" } });
		});

		const firstOption = getByTestId("SelectDropdown__option--0");

		expect(firstOption).toBeTruthy();

		act(() => {
			fireEvent.click(firstOption);
		});
	});

	it.each([OptionType.base, OptionType.group])("should select option %s", (optType) => {
		const { getByTestId } = render(<Select options={getOptions(optType)} />);

		const selectDropdown = getByTestId("SelectDropdown__input");

		act(() => {
			fireEvent.change(selectDropdown, { target: { value: "Opt" } });
		});

		const firstOption = getByTestId("SelectDropdown__option--0");

		expect(firstOption).toBeTruthy();

		act(() => {
			fireEvent.mouseDown(firstOption);
		});

		expect(getByTestId("select-list__input")).toHaveValue("1");
	});

	it.each([OptionType.base, OptionType.group])("should highlight option %s", (optType) => {
		const { getByTestId } = render(<Select options={getOptions(optType)} />);

		const selectDropdown = getByTestId("SelectDropdown__input");

		act(() => {
			fireEvent.change(selectDropdown, { target: { value: "Opt" } });
		});

		act(() => {
			fireEvent.keyDown(selectDropdown, { code: 9, key: "Tab" });
		});

		const firstOption = getByTestId("SelectDropdown__option--0");

		expect(firstOption).toBeTruthy();

		expect(firstOption).toHaveClass("is-selected");
	});

	it.each([OptionType.base, OptionType.group])("should select options %s with arrow keys", (optType) => {
		const { getByTestId } = render(<Select options={getOptions(optType)} />);

		const selectDropdown = getByTestId("SelectDropdown__input");

		act(() => {
			fireEvent.change(selectDropdown, { target: { value: "Opt" } });
		});

		act(() => {
			fireEvent.keyDown(selectDropdown, { code: 9, key: "Tab" });
		});

		act(() => {
			fireEvent.keyDown(selectDropdown, { code: 8, key: "Backspace" });
		});

		const firstOption = getByTestId("SelectDropdown__option--0");

		expect(firstOption).toBeTruthy();

		act(() => {
			fireEvent.mouseOver(firstOption);
		});

		act(() => {
			fireEvent.keyDown(selectDropdown, { code: 40, key: "ArrowDown" });
		});

		expect(firstOption).toHaveClass("is-highlighted");

		act(() => {
			fireEvent.keyDown(firstOption, { code: 13, key: "Enter" });
		});

		expect(getByTestId("select-list__input")).toHaveValue("1");
	});

	it("should highlight first option after reach to the end of the match options", () => {
		const options = [
			{
				label: "Option 1",
				value: "1",
			},
			{
				label: "Option 2",
				value: "2",
			},
			{
				label: "Item 1",
				value: "3",
			},
			{
				label: "Item 2",
				value: "4",
			},
		];

		const { getByTestId } = render(<Select options={options} />);

		const selectDropdown = getByTestId("SelectDropdown__input");

		act(() => {
			fireEvent.change(selectDropdown, { target: { value: "Opt" } });
		});

		const firstOption = getByTestId("SelectDropdown__option--0");

		expect(firstOption).toBeTruthy();

		act(() => {
			fireEvent.keyDown(selectDropdown, { code: 40, key: "ArrowDown" });
		});

		expect(firstOption).toHaveClass("is-highlighted");

		act(() => {
			fireEvent.keyDown(selectDropdown, { code: 40, key: "ArrowDown" });
		});

		const secondOption = getByTestId("SelectDropdown__option--1");

		expect(secondOption).toHaveClass("is-highlighted");

		act(() => {
			fireEvent.keyDown(selectDropdown, { code: 40, key: "ArrowDown" });
		});

		expect(firstOption).toHaveClass("is-highlighted");
	});

	it.each([OptionType.base, OptionType.group])(
		"should show suggestion when typing has found at least one match in option %s",
		(optType) => {
			const { getByTestId } = render(<Select options={getOptions(optType)} />);
			const selectDropdown = getByTestId("SelectDropdown__input");

			act(() => {
				fireEvent.change(selectDropdown, { target: { value: "Opt" } });
			});

			expect(getByTestId("Input__suggestion")).toHaveTextContent("Option 1");
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should select first matching option with enter in option %s",
		(optType) => {
			const { getByTestId } = render(<Select options={getOptions(optType)} />);
			const selectDropdown = getByTestId("SelectDropdown__input");

			act(() => {
				fireEvent.change(selectDropdown, { target: { value: "Opt" } });
			});

			act(() => {
				fireEvent.keyDown(selectDropdown, { code: 13, key: "Enter" });
			});

			expect(getByTestId("select-list__input")).toHaveValue("1");
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should select first matching option with tab in option %s",
		(optType) => {
			const { getByTestId } = render(<Select options={getOptions(optType)} />);
			const selectDropdown = getByTestId("SelectDropdown__input");

			act(() => {
				fireEvent.change(selectDropdown, { target: { value: "Opt" } });
			});

			act(() => {
				fireEvent.keyDown(selectDropdown, { code: 9, key: "Tab" });
			});

			expect(getByTestId("select-list__input")).toHaveValue("1");
		},
	);

	it.each([OptionType.base, OptionType.group])("should select new option with enter in option %s", (optType) => {
		const { getByTestId } = render(<Select options={getOptions(optType)} />);
		const selectDropdown = getByTestId("SelectDropdown__input");

		act(() => {
			fireEvent.change(selectDropdown, { target: { value: "Opt" } });
		});

		act(() => {
			fireEvent.keyDown(selectDropdown, { code: 13, key: "Enter" });
		});

		expect(selectDropdown).toHaveValue("Option 1");

		act(() => {
			fireEvent.keyDown(selectDropdown, { code: 40, key: "ArrowDown" });
		});

		act(() => {
			fireEvent.keyDown(selectDropdown, { code: 13, key: "Enter" });
		});

		expect(selectDropdown).toHaveValue("Option 2");
	});

	it.each([OptionType.base, OptionType.group])(
		"should not select non-matching option after key input and tab in option %s",
		(optType) => {
			const { getByTestId } = render(<Select options={getOptions(optType)} />);
			const selectDropdown = getByTestId("SelectDropdown__input");

			act(() => {
				fireEvent.change(selectDropdown, { target: { value: "Optt" } });
			});

			act(() => {
				fireEvent.keyDown(selectDropdown, { code: 9, key: "Tab" });
			});

			expect(getByTestId("select-list__input")).toHaveValue("");
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should not select first matched option after random key enter in option %s",
		(optType) => {
			const { getByTestId } = render(<Select options={getOptions(optType)} />);
			const selectDropdown = getByTestId("SelectDropdown__input");

			act(() => {
				fireEvent.change(selectDropdown, { target: { value: "Opt" } });
			});

			act(() => {
				fireEvent.keyDown(selectDropdown, { code: 65, key: "A" });
			});

			expect(getByTestId("select-list__input")).toHaveValue("");
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should clear selection when changing input in option %s",
		(optType) => {
			const { getByTestId } = render(<Select options={getOptions(optType)} />);
			const selectDropdown = getByTestId("SelectDropdown__input");

			act(() => {
				fireEvent.change(selectDropdown, { target: { value: "Opt" } });
			});

			act(() => {
				fireEvent.keyDown(selectDropdown, { code: 13, key: "Enter" });
			});

			expect(getByTestId("select-list__input")).toHaveValue("1");

			act(() => {
				fireEvent.change(selectDropdown, { target: { value: "test" } });
			});

			act(() => {
				fireEvent.keyDown(selectDropdown, { code: 65, key: "A" });
			});
			act(() => {
				fireEvent.keyDown(selectDropdown, { code: 65, key: "B" });
			});

			expect(getByTestId("select-list__input")).toHaveValue("");
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should select match on blur if available in option %s",
		async (optType) => {
			const { getByTestId } = render(<Select options={getOptions(optType)} />);
			const selectDropdown = getByTestId("SelectDropdown__input");

			act(() => {
				fireEvent.change(selectDropdown, { target: { value: "Opt" } });
			});

			act(() => {
				fireEvent.blur(selectDropdown);
			});

			await waitFor(() => expect(selectDropdown).toHaveValue("Option 1"));
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should clear input on blur if there is no match in option %s",
		async (optType) => {
			const { getByTestId } = render(<Select options={getOptions(optType)} />);
			const selectDropdown = getByTestId("SelectDropdown__input");

			act(() => {
				fireEvent.change(selectDropdown, { target: { value: "Foobar" } });
			});

			act(() => {
				fireEvent.blur(selectDropdown);
			});

			await waitFor(() => expect(selectDropdown).toHaveValue(""));
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should not clear input on blur if selected in option %s",
		(optType) => {
			const { getByTestId } = render(<Select options={getOptions(optType)} />);
			const selectDropdown = getByTestId("SelectDropdown__input");

			act(() => {
				fireEvent.change(selectDropdown, { target: { value: "Opt" } });
			});

			act(() => {
				fireEvent.keyDown(selectDropdown, { code: 13, key: "Enter" });
			});

			expect(selectDropdown).toHaveValue("Option 1");

			act(() => {
				fireEvent.blur(selectDropdown);
			});

			expect(selectDropdown).toHaveValue("Option 1");
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should select an option by clicking on it in option %s",
		async (optType) => {
			const { getByTestId } = render(<Select options={getOptions(optType)} />);

			act(() => {
				fireEvent.focus(getByTestId("SelectDropdown__input"));
			});

			await waitFor(() => expect(getByTestId("SelectDropdown__option--0")).toBeTruthy());

			act(() => {
				fireEvent.mouseDown(getByTestId("SelectDropdown__option--0"));
			});

			expect(getByTestId("select-list__input")).toHaveValue("1");
		},
	);

	it("should not open the dropdown on reset", () => {
		const initialValue = options[0].value;

		const Component = () => {
			const [selected, setSelected] = useState<any>(initialValue);
			const onChange = (x: any) => setSelected(x?.value);

			return (
				<>
					<Select onChange={onChange} defaultValue={selected} options={options} />
					<button type="button" data-testid="btn-reset" onClick={() => setSelected(null)}>
						Reset
					</button>
				</>
			);
		};

		const { getByTestId, queryByText } = render(<Component />);

		// check dropdown not open
		expect(getByTestId("select-list__input")).toHaveValue(initialValue);
		expect(queryByText("Option 2")).not.toBeInTheDocument();

		// set null value
		act(() => {
			fireEvent.click(getByTestId("btn-reset"));
		});

		// check value reset and dropdown not open
		expect(getByTestId("select-list__input")).toHaveValue("");
		expect(queryByText("Option 2")).not.toBeInTheDocument();
	});

	it.each([OptionType.base, OptionType.group])("should allow entering free text in option %s", (optType) => {
		const { getByTestId } = render(<Select options={getOptions(optType)} allowFreeInput />);
		const selectDropdown = getByTestId("SelectDropdown__input");

		act(() => {
			fireEvent.change(selectDropdown, { target: { value: "Test" } });
		});

		expect(getByTestId("select-list__input")).toHaveValue("Test");
	});

	it.each([OptionType.base, OptionType.group])(
		"should allow entering free text and handle blur event in option %s",
		(optType) => {
			const { getByTestId } = render(<Select options={getOptions(optType)} allowFreeInput={true} />);
			const selectDropdown = getByTestId("SelectDropdown__input");

			act(() => {
				fireEvent.change(selectDropdown, { target: { value: "Test" } });
			});

			act(() => {
				fireEvent.blur(selectDropdown);
			});

			expect(getByTestId("select-list__input")).toHaveValue("Test");
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should render option %s with default value when free text is allowed",
		(optType) => {
			const { container, getByTestId } = render(
				<Select options={getOptions(optType)} defaultValue="3" allowFreeInput />,
			);

			expect(getByTestId("select-list__input")).toHaveValue("3");
			expect(container).toMatchSnapshot();
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should hide dropdown in option %s when no matches found in free text mode",
		(optType) => {
			const { getByTestId } = render(<Select options={getOptions(optType)} defaultValue="3" allowFreeInput />);
			const selectDropdown = getByTestId("SelectDropdown__input");
			act(() => {
				fireEvent.change(selectDropdown, { target: { value: options[0].label } });
			});

			expect(getByTestId("select-list__input")).toHaveValue(options[0].label);

			act(() => {
				fireEvent.change(selectDropdown, { target: { value: "Unmatched" } });
			});

			expect(() => getByTestId("SelectDropdown__option--0")).toThrow();
		},
	);

	it.each([OptionType.base, OptionType.group])("should show all options %s when empty input", (optType) => {
		const { getByTestId } = render(<Select options={getOptions(optType)} defaultValue="3" allowFreeInput />);
		const selectDropdown = getByTestId("SelectDropdown__input");
		act(() => {
			fireEvent.change(selectDropdown, { target: { value: options[0].label } });
		});

		expect(getByTestId("select-list__input")).toHaveValue(options[0].label);

		act(() => {
			fireEvent.change(selectDropdown, { target: { value: "" } });
		});

		expect(getByTestId("select-list__input")).toHaveValue("");
		expect(getByTestId("SelectDropdown__option--0")).toBeTruthy();
		expect(getByTestId("SelectDropdown__option--1")).toBeTruthy();
		expect(getByTestId("SelectDropdown__option--2")).toBeTruthy();
	});
});
