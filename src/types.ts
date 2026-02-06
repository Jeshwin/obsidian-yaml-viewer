/** A YAML mapping (object) */
export interface YAMLMapping {
	[key: string]: YAMLValue;
}

/** The parsed YAML value -- any valid YAML data type */
export type YAMLValue =
	| string
	| number
	| boolean
	| null
	| YAMLValue[]
	| YAMLMapping;

/** Represents a path to a specific node in the YAML tree */
export type YAMLPath = (string | number)[];

/** Describes the type of a YAML node for UI rendering */
export type YAMLNodeType = "string" | "number" | "boolean" | "null" | "sequence" | "mapping";

/** Plugin settings interface */
export interface YAMLViewerSettings {
	/** Number of nesting levels to expand by default */
	defaultExpandDepth: number;
	/** Whether to show type badges next to values */
	showTypeBadges: boolean;
	/** Indentation width for YAML dump output (2 or 4 spaces) */
	indentWidth: number;
	/** Sort keys alphabetically when serializing */
	sortKeys: boolean;
}
