import { Plugin } from "obsidian";
import type { YAMLViewerSettings } from "./types";
import { DEFAULT_SETTINGS, YAMLViewerSettingTab } from "./settings";
import { YAML_VIEW_TYPE } from "./constants";
import { YAMLView } from "./ui/YAMLView";

export default class YAMLViewerPlugin extends Plugin {
	settings: YAMLViewerSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(YAML_VIEW_TYPE, (leaf) => new YAMLView(leaf, this));
		this.registerExtensions(["yaml", "yml"], YAML_VIEW_TYPE);

		this.addSettingTab(new YAMLViewerSettingTab(this.app, this));

		this.addCommand({
			id: "reload-yaml-view",
			name: "Reload current YAML view",
			checkCallback: (checking: boolean) => {
				const view = this.app.workspace.getActiveViewOfType(YAMLView);
				if (view) {
					if (!checking) {
						view.renderView();
					}
					return true;
				}
				return false;
			},
		});
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData() as Partial<YAMLViewerSettings> | null,
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
