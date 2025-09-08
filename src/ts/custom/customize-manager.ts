import { Options } from "tabulator-tables";
import { ITableCustomizer } from "./ITableCustomizer";
import { SxcCockpitTableConfig } from "../models/table-config";

/**
 * Manager class for handling table customizers
 * Implements the Singleton pattern to ensure only one instance exists
 */
export class CustomizeManager {
  private static instance: CustomizeManager;
  private customizers: ITableCustomizer[] = [];
  private activeCustomizers: Map<string, ITableCustomizer[]> = new Map();

  // Private constructor for singleton pattern
  private constructor() {}

  /**
   * Get the singleton instance of the CustomizeManager
   */
  public static getInstance(): CustomizeManager {
    if (!CustomizeManager.instance) {
      CustomizeManager.instance = new CustomizeManager();
    }
    return CustomizeManager.instance;
  }

  /**
   * Register a customizer with the manager
   * @param customizer The customizer to register
   */
  public registerCustomizer(customizer: ITableCustomizer): void {
    this.customizers.push(customizer);
  }

  /**
   * Apply customizations to the table configuration
   * @param config The original table configuration
   * @returns The modified table configuration
   */
  public customizeConfig(config: SxcCockpitTableConfig): SxcCockpitTableConfig {
    // Clear active customizers for this table
    this.activeCustomizers.delete(config.guid);

    // Apply each customizer that should be applied to this config
    let modifiedConfig = { ...config };
    const activeCustomizersForThisTable: ITableCustomizer[] = [];

    for (const customizer of this.customizers) {
      if (customizer.shouldApply(config)) {
        // Store this customizer as active for this config
        activeCustomizersForThisTable.push(customizer);
        modifiedConfig = customizer.customizeConfig(modifiedConfig);
      }
    }

    // Store all active customizers for this table
    if (activeCustomizersForThisTable.length > 0) {
      this.activeCustomizers.set(config.guid, activeCustomizersForThisTable);
    }

    return modifiedConfig;
  }

  /**
   * Apply customizations to the Tabulator options
   * @param options The original Tabulator options
   * @param configGuid The GUID of the table configuration
   * @returns The modified Tabulator options
   */
  public customizeTabulator(options: Options, configGuid: string): Options {
    // Apply all customizers that were active for this config
    let modifiedOptions = { ...options };

    const customizersForThisTable =
      this.activeCustomizers.get(configGuid) || [];

    for (const customizer of customizersForThisTable) {
      modifiedOptions = customizer.customizeTabulator(modifiedOptions);
    }

    return modifiedOptions;
  }
}
