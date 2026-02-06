import { App, Modal, Setting } from "obsidian";
import type { YAMLValue } from "../types";

type ContextType = "mapping" | "sequence";

/** Coerce a string value into the appropriate JS type based on the selected YAML type. */
function coerceValue(raw: string, type: string): YAMLValue {
	switch (type) {
		case "string":
			return raw;
		case "number": {
			const num = Number(raw);
			return isNaN(num) ? 0 : num;
		}
		case "boolean":
			return raw.toLowerCase() === "true" || raw === "1";
		case "null":
			return null;
		case "mapping":
			return {};
		case "sequence":
			return [];
		default:
			return raw;
	}
}

export class AddEntryModal extends Modal {
	private contextType: ContextType;
	private onSubmit: (key: string, value: YAMLValue) => void;

	private keyInput = "";
	private valueInput = "";
	private valueType = "string";

	constructor(
		app: App,
		contextType: ContextType,
		onSubmit: (key: string, value: YAMLValue) => void,
	) {
		super(app);
		this.contextType = contextType;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		this.titleEl.setText(
			this.contextType === "mapping" ? "Add new key-value pair" : "Add new item",
		);

		if (this.contextType === "mapping") {
			new Setting(contentEl)
				.setName("Key")
				.setDesc("The key name for the new entry.")
				.addText((text) =>
					text
						.setPlaceholder("Enter key name")
						.onChange((value) => {
							this.keyInput = value;
						}),
				);
		}

		let valueSetting: Setting | null = null;

		new Setting(contentEl)
			.setName("Type")
			.setDesc("Select the data type for the value.")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						string: "String",
						number: "Number",
						boolean: "Boolean",
						null: "Null",
						mapping: "Object (empty)",
						sequence: "Array (empty)",
					})
					.setValue(this.valueType)
					.onChange((value) => {
						this.valueType = value;
						if (valueSetting) {
							valueSetting.settingEl.style.display =
								value === "null" || value === "mapping" || value === "sequence"
									? "none"
									: "";
						}
					}),
			);

		valueSetting = new Setting(contentEl)
			.setName("Value")
			.setDesc("The initial value for the new entry.")
			.addText((text) =>
				text
					.setPlaceholder("Enter value")
					.onChange((value) => {
						this.valueInput = value;
					}),
			);

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Add")
					.setCta()
					.onClick(() => {
						if (this.contextType === "mapping" && this.keyInput.trim() === "") {
							return;
						}
						const finalValue = coerceValue(this.valueInput, this.valueType);
						this.onSubmit(this.keyInput, finalValue);
						this.close();
					}),
			);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
