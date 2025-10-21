// Exports the set of customizers and a helper to register them with a manager.
// Tabulator-table will import this module and register the customizers.

// NOTE: If you move customizers into their own package for production, publish a module
// that exposes the same API (export const customizers, export function registerAll(manager?))
// and update the import in tabulator-table.ts to the package name.

import { CustomizeManager } from "./custom/customize-manager";
import { CustomizeAccessCodesTable } from "./custom/customizers/customize-access-codes";
import type { ITableCustomizer } from "./custom/ITableCustomizer";

// Export the instances so callers can either register them or inspect them.
export const customizers: ITableCustomizer[] = [
  new CustomizeAccessCodesTable(),
  // add more customizer instances here as needed
];

/**
 * Register all built-in customizers with the provided manager.
 * If no manager is provided, the default singleton is used.
 */
export function registerAll(manager?: CustomizeManager) {
  const mgr = manager ?? CustomizeManager.getInstance();
  mgr.registerCustomizers(customizers);
  return customizers;
}

export default {
  customizers,
  registerAll,
};

console.log("radmin customizers 0.2.0");