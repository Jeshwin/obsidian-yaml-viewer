import { App, Notice } from "obsidian";
import type { YAMLValue, YAMLPath, YAMLViewerSettings, YAMLMapping } from "../types";
import { getNodeType, getValueAtPath, deleteValueAtPath } from "../utils/typeUtils";
import { AddEntryModal } from "./AddEntryModal";

export class NodeActions {
	private app: App;

	constructor(
		app: App,
		_settings: YAMLViewerSettings,
	) {
		this.app = app;
	}

	/**
	 * Handle adding a new entry to a collection at the given path.
	 * For the root, path is []. If the root is null, a new mapping is created.
	 */
	handleAdd(
		rootData: YAMLValue,
		path: YAMLPath,
		onComplete: (updatedData: YAMLValue) => void,
	): void {
		let target: YAMLValue;

		if (path.length === 0) {
			target = rootData;
		} else {
			target = getValueAtPath(rootData, path) ?? null;
		}

		if ((target === null || target === undefined) && path.length === 0) {
			const modal = new AddEntryModal(this.app, "mapping", (key, value) => {
				const newRoot: YAMLMapping = { [key]: value };
				onComplete(newRoot);
			});
			modal.open();
			return;
		}

		const targetType = getNodeType(target);

		if (targetType === "mapping") {
			const modal = new AddEntryModal(this.app, "mapping", (key, value) => {
				const mapping = target as YAMLMapping;
				if (key in mapping) {
					new Notice(`Key "${key}" already exists. Use edit to modify its value.`);
					return;
				}
				mapping[key] = value;
				onComplete(rootData);
			});
			modal.open();
		} else if (targetType === "sequence") {
			const modal = new AddEntryModal(this.app, "sequence", (_key, value) => {
				(target as YAMLValue[]).push(value);
				onComplete(rootData);
			});
			modal.open();
		} else {
			new Notice("Cannot add children to a scalar value.");
		}
	}

	/**
	 * Handle deleting the entry at the given path.
	 */
	handleDelete(
		rootData: YAMLValue,
		path: YAMLPath,
		onComplete: (updatedData: YAMLValue) => void,
	): void {
		if (path.length === 0) {
			onComplete(null);
			return;
		}

		const success = deleteValueAtPath(rootData, path);
		if (success) {
			onComplete(rootData);
		} else {
			new Notice("Failed to delete entry.");
		}
	}
}
