import { TextFileView, WorkspaceLeaf } from "obsidian";
import { YAML_VIEW_TYPE, YAML_VIEW_ICON } from "../constants";
import type { YAMLValue } from "../types";
import type YAMLViewerPlugin from "../main";
import { parseYAML, dumpYAML } from "../utils/yamlParser";
import { YAMLRenderer } from "./YAMLRenderer";

export class YAMLView extends TextFileView {
	plugin: YAMLViewerPlugin;
	private parsedData: YAMLValue = null;
	private renderer: YAMLRenderer | null = null;
	private parseError: string | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: YAMLViewerPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.icon = YAML_VIEW_ICON;
	}

	getViewType(): string {
		return YAML_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.file?.basename ?? "YAML";
	}

	/**
	 * Called by Obsidian when file content is available.
	 * Parse the YAML and render the tree.
	 */
	setViewData(data: string, clear: boolean): void {
		this.data = data;
		if (clear) {
			this.clear();
		}

		const result = parseYAML(data);
		if (result.success) {
			this.parsedData = result.data;
			this.parseError = null;
		} else {
			this.parsedData = null;
			this.parseError = result.error;
		}

		this.renderView();
	}

	/**
	 * Called by Obsidian when it needs the current data string to save.
	 */
	getViewData(): string {
		if (this.parseError !== null) {
			return this.data;
		}
		return dumpYAML(this.parsedData, this.plugin.settings);
	}

	/**
	 * Called when switching to a different file. Reset all state.
	 */
	clear(): void {
		this.parsedData = null;
		this.parseError = null;
		this.renderer = null;
		this.contentEl.empty();
	}

	/**
	 * Build or rebuild the DOM tree from parsedData.
	 */
	renderView(): void {
		this.contentEl.empty();

		if (this.parseError !== null) {
			this.renderError(this.parseError);
			return;
		}

		const container = this.contentEl.createDiv({ cls: "yaml-viewer-container" });

		const toolbar = container.createDiv({ cls: "yaml-viewer-toolbar" });
		const addBtn = toolbar.createEl("button", {
			cls: "yaml-viewer-toolbar-btn",
			text: "Add entry",
			attr: { "aria-label": "Add a new root-level entry" },
		});
		addBtn.addEventListener("click", () => {
			this.renderer?.addRootEntry();
		});

		const treeContainer = container.createDiv({ cls: "yaml-viewer-tree" });

		this.renderer = new YAMLRenderer(
			treeContainer,
			this.parsedData,
			this.plugin.settings,
			this.app,
			(updatedData: YAMLValue) => {
				this.parsedData = updatedData;
				this.data = dumpYAML(this.parsedData, this.plugin.settings);
				this.requestSave();
			},
			() => this.renderView(),
		);
		this.renderer.render();
	}

	private renderError(error: string): void {
		const container = this.contentEl.createDiv({ cls: "yaml-viewer-error" });
		container.createEl("h3", { text: "YAML parse error" });
		container.createEl("pre", { text: error, cls: "yaml-viewer-error-detail" });
		container.createEl("p", {
			text: "The file contains invalid YAML. Edit it in a text editor to fix the syntax.",
			cls: "yaml-viewer-error-hint",
		});
	}
}
