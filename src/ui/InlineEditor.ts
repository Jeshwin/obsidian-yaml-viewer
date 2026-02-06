import type { YAMLValue, YAMLPath } from "../types";
import { getNodeType, setValueAtPath } from "../utils/typeUtils";

/**
 * Provides inline editing for scalar values in the YAML tree.
 * Replaces the value display element with an input field.
 */
export class InlineEditor {
	/**
	 * Replace the given element with an inline text input for editing.
	 * On commit (Enter or blur), the value is written back to the data tree.
	 */
	static edit(
		valueEl: HTMLElement,
		currentValue: string | number | boolean | null,
		path: YAMLPath,
		rootData: YAMLValue,
		onChange: (data: YAMLValue) => void,
		onRerender: () => void,
	): void {
		if (valueEl.querySelector("input")) return;

		const originalText = valueEl.textContent ?? "";
		const currentType = getNodeType(currentValue);
		const rawValue = currentValue === null ? "" : String(currentValue);

		const inputEl = document.createElement("input");
		inputEl.type = "text";
		inputEl.value = rawValue;
		inputEl.className = "yaml-viewer-inline-input";

		valueEl.empty();
		valueEl.appendChild(inputEl);
		inputEl.focus();
		inputEl.select();

		let committed = false;

		const commit = (): void => {
			if (committed) return;
			committed = true;

			const newRawValue = inputEl.value;
			const newValue = InlineEditor.parseInlineValue(newRawValue, currentType);

			if (path.length === 0) {
				onChange(newValue);
			} else {
				setValueAtPath(rootData, path, newValue);
				onChange(rootData);
			}

			onRerender();
		};

		const cancel = (): void => {
			if (committed) return;
			committed = true;
			valueEl.empty();
			valueEl.setText(originalText);
		};

		inputEl.addEventListener("keydown", (evt: KeyboardEvent) => {
			if (evt.key === "Enter") {
				evt.preventDefault();
				commit();
			} else if (evt.key === "Escape") {
				evt.preventDefault();
				cancel();
			}
		});

		inputEl.addEventListener("blur", () => {
			setTimeout(() => commit(), 100);
		});
	}

	/**
	 * Parse a string input back to the appropriate type.
	 * Tries to preserve the original type if the input is valid for that type.
	 */
	private static parseInlineValue(raw: string, originalType: string): YAMLValue {
		if (originalType === "number") {
			const num = Number(raw);
			if (!isNaN(num)) return num;
		}
		if (originalType === "boolean") {
			if (raw.toLowerCase() === "true" || raw === "1") return true;
			if (raw.toLowerCase() === "false" || raw === "0") return false;
		}
		if (originalType === "null" && (raw === "" || raw.toLowerCase() === "null")) {
			return null;
		}

		if (raw === "" || raw.toLowerCase() === "null") return null;
		if (raw.toLowerCase() === "true") return true;
		if (raw.toLowerCase() === "false") return false;
		const asNum = Number(raw);
		if (!isNaN(asNum) && raw.trim() !== "") return asNum;

		return raw;
	}
}
