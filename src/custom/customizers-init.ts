import { CustomizeManager } from "./customize-manager";
import { CustomizeSkillsAndGrowth } from "./customizers/customize-skills-and-growth";
import { CustomizeRolesTable } from "./customizers/customize-roles-table";

/**
 * Initialize all customizers and register them with the CustomizeManager
 */
export function initializeCustomizers(): void {
  const manager = CustomizeManager.getInstance();

  // Register all customizers here
  manager.registerCustomizer(new CustomizeSkillsAndGrowth());
  manager.registerCustomizer(new CustomizeRolesTable());
}
