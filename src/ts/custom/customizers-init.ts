import { CustomizeManager } from "./customize-manager";
import { CustomizeAccessCodesTable } from "./customizers/customize-access-codes";

/**
 * Initialize all customizers and register them with the CustomizeManager
 */
export function initializeCustomizers(): void {
  const manager = CustomizeManager.getInstance();

  // Register all customizers here
  manager.registerCustomizer(new CustomizeAccessCodesTable());
}
