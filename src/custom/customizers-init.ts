import { CustomizeManager } from "./customize-manager";
import { CustomizeSkillsAndGrowth } from "./customize-skills-and-growth";

/**
 * Initialize all customizers and register them with the CustomizeManager
 */
export function initializeCustomizers(): void {
  const manager = CustomizeManager.getInstance();
  
  // Register all customizers here
  manager.registerCustomizer(new CustomizeSkillsAndGrowth());
}