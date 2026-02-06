import { parse, stringify } from "yaml";
import type { YAMLValue, YAMLViewerSettings } from "../types";

export type ParseResult = {
	success: true;
	data: YAMLValue;
} | {
	success: false;
	error: string;
};

/**
 * Parse a YAML string into a JavaScript value.
 * Returns a discriminated union for clean error handling.
 */
export function parseYAML(raw: string): ParseResult {
	if (raw.trim() === "") {
		return { success: true, data: null };
	}
	try {
		const data = parse(raw) as YAMLValue;
		return { success: true, data };
	} catch (e: unknown) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Unknown parse error",
		};
	}
}

/**
 * Serialize a JavaScript value back to a YAML string.
 * Uses settings for indent width and sort keys.
 */
export function dumpYAML(data: YAMLValue, settings: YAMLViewerSettings): string {
	if (data === null || data === undefined) {
		return "";
	}
	return stringify(data, {
		indent: settings.indentWidth,
		sortMapEntries: settings.sortKeys,
		lineWidth: 120,
	});
}
