import { Options } from "tabulator-tables";
import { DataViewTableConfig } from "../ts/models/data-view-table-config";
import { ITableCustomizer } from "./ITableCustomizer";

/**
 * Manager class for handling table customizers
 * Implements the Singleton pattern to ensure only one instance exists
 */
export class CustomizeManager {
  private static instance: CustomizeManager;
  private customizers: ITableCustomizer[] = [];
  private activeCustomizers: Map<string, ITableCustomizer> = new Map();

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
  public customizeConfig(config: DataViewTableConfig): DataViewTableConfig {
    // Clear active customizers for this session
    this.activeCustomizers.clear();

    // Apply each customizer that should be applied to this config
    let modifiedConfig = { ...config };

    for (const customizer of this.customizers) {
      if (customizer.shouldApply(config)) {
        // Store this customizer as active for this config
        this.activeCustomizers.set(config.guid, customizer);
        modifiedConfig = customizer.customizeConfig(modifiedConfig);
      }
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
    // Apply only the customizers that were active for this config
    let modifiedOptions = { ...options };

    const customizer = this.activeCustomizers.get(configGuid);
    if (customizer) {
      modifiedOptions = customizer.customizeTabulator(modifiedOptions);
    }

    return modifiedOptions;
  }
}
