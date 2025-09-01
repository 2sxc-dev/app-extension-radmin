import { CustomizeManager } from "./customize-manager";
import { CustomizeSkillsAndGrowth } from "./customizers/customize-skills-and-growth";
import { CustomizeRolesTable } from "./customizers/customize-roles-table";
import { CustomizeResourceTable } from "./customizers/customize-resource";
import { CustomizeTrainingsTable } from "./customizers/customize-trainings";

/**
 * Initialize all customizers and register them with the CustomizeManager
 */
export function initializeCustomizers(): void {
  const manager = CustomizeManager.getInstance();

  // Register all customizers here
  manager.registerCustomizer(new CustomizeSkillsAndGrowth());
  manager.registerCustomizer(new CustomizeRolesTable());
  manager.registerCustomizer(new CustomizeResourceTable());
  manager.registerCustomizer(new CustomizeTrainingsTable());
}
