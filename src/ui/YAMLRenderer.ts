import { App, setIcon } from "obsidian";
import type { YAMLValue, YAMLMapping, YAMLPath, YAMLViewerSettings } from "../types";
import { getNodeType, getTypeBadgeLabel, formatScalarDisplay } from "../utils/typeUtils";
import { NodeActions } from "./NodeActions";
import { InlineEditor } from "./InlineEditor";

export class YAMLRenderer {
	private containerEl: HTMLElement;
	private data: YAMLValue;
	private settings: YAMLViewerSettings;
	private onChange: (data: YAMLValue) => void;
	private onRerender: () => void;
	private nodeActions: NodeActions;

	constructor(
		containerEl: HTMLElement,
		data: YAMLValue,
		settings: YAMLViewerSettings,
		app: App,
		onChange: (data: YAMLValue) => void,
		onRerender: () => void,
	) {
		this.containerEl = containerEl;
		this.data = data;
		this.settings = settings;
		this.onChange = onChange;
		this.onRerender = onRerender;
		this.nodeActions = new NodeActions(app, settings);
	}

	render(): void {
		this.containerEl.empty();

		if (this.data === null || this.data === undefined) {
			const emptyMsg = this.containerEl.createDiv({ cls: "yaml-viewer-empty" });
			emptyMsg.setText("Empty YAML document");
			return;
		}

		this.renderNode(this.containerEl, this.data, [], 0);
	}

	addRootEntry(): void {
		this.nodeActions.handleAdd(this.data, [], (updatedData) => {
			this.data = updatedData;
			this.onChange(this.data);
			this.onRerender();
		});
	}

	private renderNode(
		parentEl: HTMLElement,
		value: YAMLValue,
		path: YAMLPath,
		depth: number,
	): void {
		const nodeType = getNodeType(value);

		switch (nodeType) {
			case "mapping":
				this.renderMapping(parentEl, value as YAMLMapping, path, depth);
				break;
			case "sequence":
				this.renderSequence(parentEl, value as YAMLValue[], path, depth);
				break;
			default:
				this.renderRootScalar(parentEl, value as string | number | boolean | null, path);
				break;
		}
	}

	private renderMapping(
		parentEl: HTMLElement,
		mapping: YAMLMapping,
		path: YAMLPath,
		depth: number,
	): void {
		const keys = Object.keys(mapping);
		for (const key of keys) {
			const value = mapping[key] as YAMLValue;
			const childPath = [...path, key];
			const childType = getNodeType(value);
			const isCollection = childType === "mapping" || childType === "sequence";

			const rowEl = parentEl.createDiv({ cls: "yaml-viewer-row" });

			if (isCollection) {
				this.renderCollectionRow(rowEl, key, value, childPath, depth, childType);
			} else {
				this.renderScalarRow(rowEl, key, value as string | number | boolean | null, childPath);
			}
		}
	}

	private renderSequence(
		parentEl: HTMLElement,
		sequence: YAMLValue[],
		path: YAMLPath,
		depth: number,
	): void {
		sequence.forEach((item, index) => {
			const childPath = [...path, index];
			const childType = getNodeType(item);
			const isCollection = childType === "mapping" || childType === "sequence";

			const rowEl = parentEl.createDiv({ cls: "yaml-viewer-row" });

			if (isCollection) {
				this.renderCollectionRow(rowEl, index, item, childPath, depth, childType);
			} else {
				this.renderScalarRow(rowEl, index, item as string | number | boolean | null, childPath);
			}
		});
	}

	private renderCollectionRow(
		rowEl: HTMLElement,
		keyOrIndex: string | number,
		value: YAMLValue,
		path: YAMLPath,
		depth: number,
		childType: "mapping" | "sequence",
	): void {
		const isExpanded = depth < this.settings.defaultExpandDepth;

		const headerEl = rowEl.createDiv({ cls: "yaml-viewer-node-header" });

		const toggleEl = headerEl.createSpan({ cls: "yaml-viewer-toggle" });
		setIcon(toggleEl, isExpanded ? "chevron-down" : "chevron-right");

		const keyEl = headerEl.createSpan({ cls: "yaml-viewer-key" });
		if (typeof keyOrIndex === "number") {
			keyEl.setText(`[${keyOrIndex}]`);
			keyEl.addClass("yaml-viewer-key-index");
		} else {
			keyEl.setText(`${keyOrIndex}:`);
		}

		if (this.settings.showTypeBadges) {
			const badge = headerEl.createSpan({ cls: `yaml-viewer-badge yaml-viewer-badge-${childType}` });
			badge.setText(getTypeBadgeLabel(childType));
		}

		const count = Array.isArray(value) ? value.length : Object.keys(value as YAMLMapping).length;
		const countEl = headerEl.createSpan({ cls: "yaml-viewer-count" });
		countEl.setText(`(${count} ${count === 1 ? "item" : "items"})`);

		this.renderActionButtons(headerEl, path, true);

		const childrenEl = rowEl.createDiv({ cls: "yaml-viewer-children" });
		if (!isExpanded) {
			childrenEl.addClass("yaml-viewer-collapsed");
		}

		toggleEl.addEventListener("click", () => {
			const nowExpanded = !childrenEl.hasClass("yaml-viewer-collapsed");
			childrenEl.toggleClass("yaml-viewer-collapsed", nowExpanded);
			toggleEl.empty();
			setIcon(toggleEl, nowExpanded ? "chevron-right" : "chevron-down");
		});

		this.renderNode(childrenEl, value, path, depth + 1);
	}

	private renderScalarRow(
		rowEl: HTMLElement,
		keyOrIndex: string | number,
		value: string | number | boolean | null,
		path: YAMLPath,
	): void {
		rowEl.addClass("yaml-viewer-scalar-row");
		const headerEl = rowEl.createDiv({ cls: "yaml-viewer-node-header" });

		headerEl.createSpan({ cls: "yaml-viewer-toggle-spacer" });

		const keyEl = headerEl.createSpan({ cls: "yaml-viewer-key" });
		if (typeof keyOrIndex === "number") {
			keyEl.setText(`[${keyOrIndex}]`);
			keyEl.addClass("yaml-viewer-key-index");
		} else {
			keyEl.setText(`${keyOrIndex}:`);
		}

		const nodeType = getNodeType(value);
		const valueEl = headerEl.createSpan({
			cls: `yaml-viewer-value yaml-viewer-value-${nodeType}`,
		});
		valueEl.setText(formatScalarDisplay(value));

		if (this.settings.showTypeBadges) {
			const badge = headerEl.createSpan({ cls: `yaml-viewer-badge yaml-viewer-badge-${nodeType}` });
			badge.setText(getTypeBadgeLabel(nodeType));
		}

		this.renderActionButtons(headerEl, path, false);

		valueEl.addEventListener("dblclick", () => {
			InlineEditor.edit(valueEl, value, path, this.data, this.onChange, this.onRerender);
		});
	}

	private renderRootScalar(
		parentEl: HTMLElement,
		value: string | number | boolean | null,
		path: YAMLPath,
	): void {
		const nodeType = getNodeType(value);
		const rowEl = parentEl.createDiv({ cls: "yaml-viewer-row yaml-viewer-scalar-row" });
		const headerEl = rowEl.createDiv({ cls: "yaml-viewer-node-header" });
		const valueEl = headerEl.createSpan({
			cls: `yaml-viewer-value yaml-viewer-value-${nodeType}`,
		});
		valueEl.setText(formatScalarDisplay(value));

		if (this.settings.showTypeBadges) {
			const badge = headerEl.createSpan({ cls: `yaml-viewer-badge yaml-viewer-badge-${nodeType}` });
			badge.setText(getTypeBadgeLabel(nodeType));
		}

		valueEl.addEventListener("dblclick", () => {
			InlineEditor.edit(valueEl, value, path, this.data, this.onChange, this.onRerender);
		});
	}

	private renderActionButtons(
		headerEl: HTMLElement,
		path: YAMLPath,
		isCollection: boolean,
	): void {
		const actionsEl = headerEl.createSpan({ cls: "yaml-viewer-actions" });

		if (isCollection) {
			const addBtn = actionsEl.createSpan({
				cls: "yaml-viewer-action-btn",
				attr: { "aria-label": "Add child entry" },
			});
			setIcon(addBtn, "plus");
			addBtn.addEventListener("click", (evt) => {
				evt.stopPropagation();
				this.nodeActions.handleAdd(this.data, path, (updatedData) => {
					this.data = updatedData;
					this.onChange(this.data);
					this.onRerender();
				});
			});
		}

		const deleteBtn = actionsEl.createSpan({
			cls: "yaml-viewer-action-btn yaml-viewer-action-delete",
			attr: { "aria-label": "Delete entry" },
		});
		setIcon(deleteBtn, "trash-2");
		deleteBtn.addEventListener("click", (evt) => {
			evt.stopPropagation();
			this.nodeActions.handleDelete(this.data, path, (updatedData) => {
				this.data = updatedData;
				this.onChange(this.data);
				this.onRerender();
			});
		});
	}
}
