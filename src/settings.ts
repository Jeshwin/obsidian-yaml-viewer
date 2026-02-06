import { App, PluginSettingTab, Setting } from "obsidian";
import type YAMLViewerPlugin from "./main";
import type { YAMLViewerSettings } from "./types";

export const DEFAULT_SETTINGS: YAMLViewerSettings = {
	defaultExpandDepth: 2,
	showTypeBadges: true,
	indentWidth: 2,
	sortKeys: false,
};

export class YAMLViewerSettingTab extends PluginSettingTab {
	plugin: YAMLViewerPlugin;

	constructor(app: App, plugin: YAMLViewerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Default expand depth")
			.setDesc("Number of nesting levels to expand by default when opening a file (0 = collapse all).")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ "0": "0", "1": "1", "2": "2", "3": "3", "5": "5", "10": "10" })
					.setValue(String(this.plugin.settings.defaultExpandDepth))
					.onChange(async (value) => {
						this.plugin.settings.defaultExpandDepth = parseInt(value, 10);
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show type badges")
			.setDesc("Display small type indicators (str, num, bool, null) next to scalar values.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showTypeBadges)
					.onChange(async (value) => {
						this.plugin.settings.showTypeBadges = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Indent width")
			.setDesc("Number of spaces per indentation level in the saved YAML output.")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ "2": "2 spaces", "4": "4 spaces" })
					.setValue(String(this.plugin.settings.indentWidth))
					.onChange(async (value) => {
						this.plugin.settings.indentWidth = parseInt(value, 10);
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Sort keys")
			.setDesc("Sort mapping keys alphabetically when saving.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.sortKeys)
					.onChange(async (value) => {
						this.plugin.settings.sortKeys = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
