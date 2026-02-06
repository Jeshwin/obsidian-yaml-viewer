import type { YAMLNodeType, YAMLValue, YAMLPath } from "../types";

/** Determine the YAML node type of a value */
export function getNodeType(value: YAMLValue): YAMLNodeType {
	if (value === null || value === undefined) return "null";
	if (typeof value === "string") return "string";
	if (typeof value === "number") return "number";
	if (typeof value === "boolean") return "boolean";
	if (Array.isArray(value)) return "sequence";
	if (typeof value === "object") return "mapping";
	return "string";
}

/** Short label for type badges */
export function getTypeBadgeLabel(type: YAMLNodeType): string {
	switch (type) {
		case "string": return "str";
		case "number": return "num";
		case "boolean": return "bool";
		case "null": return "null";
		case "sequence": return "seq";
		case "mapping": return "map";
	}
}

/** Format a scalar value for display */
export function formatScalarDisplay(value: string | number | boolean | null): string {
	if (value === null) return "null";
	if (typeof value === "boolean") return value ? "true" : "false";
	if (typeof value === "number") return String(value);
	if (typeof value === "string") {
		if (value === "") return '""';
		if (value.includes("\n")) return value.split("\n")[0] + "...";
		return value;
	}
	return String(value);
}

/**
 * Retrieve a value from a nested object by path.
 * Returns undefined if the path is invalid.
 */
export function getValueAtPath(root: YAMLValue, path: YAMLPath): YAMLValue | undefined {
	let current: YAMLValue | undefined = root;
	for (const segment of path) {
		if (current === null || current === undefined) return undefined;
		if (Array.isArray(current) && typeof segment === "number") {
			current = current[segment];
		} else if (typeof current === "object" && !Array.isArray(current) && typeof segment === "string") {
			current = current[segment];
		} else {
			return undefined;
		}
	}
	return current;
}

/**
 * Set a value at a specific path in a nested object.
 * Mutates the root object in place. Returns true if successful.
 */
export function setValueAtPath(root: YAMLValue, path: YAMLPath, value: YAMLValue): boolean {
	if (path.length === 0) return false;
	const parentPath = path.slice(0, -1);
	const lastSegment = path[path.length - 1];
	const parent = parentPath.length === 0 ? root : getValueAtPath(root, parentPath);
	if (parent === null || parent === undefined) return false;
	if (lastSegment === undefined) return false;

	if (Array.isArray(parent) && typeof lastSegment === "number") {
		parent[lastSegment] = value;
		return true;
	} else if (typeof parent === "object" && !Array.isArray(parent) && typeof lastSegment === "string") {
		parent[lastSegment] = value;
		return true;
	}
	return false;
}

/**
 * Delete a value at a specific path. For sequences, splices the element out.
 * For mappings, deletes the key.
 */
export function deleteValueAtPath(root: YAMLValue, path: YAMLPath): boolean {
	if (path.length === 0) return false;
	const parentPath = path.slice(0, -1);
	const lastSegment = path[path.length - 1];
	const parent = parentPath.length === 0 ? root : getValueAtPath(root, parentPath);
	if (parent === null || parent === undefined) return false;
	if (lastSegment === undefined) return false;

	if (Array.isArray(parent) && typeof lastSegment === "number") {
		parent.splice(lastSegment, 1);
		return true;
	} else if (typeof parent === "object" && !Array.isArray(parent) && typeof lastSegment === "string") {
		delete parent[lastSegment];
		return true;
	}
	return false;
}
