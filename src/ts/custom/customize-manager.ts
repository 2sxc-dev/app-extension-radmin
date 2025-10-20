// (replacement for your existing customize-manager.ts)
import { Options } from "tabulator-tables";
import { ITableCustomizer } from "./ITableCustomizer";
import { RadminTable } from "../models/radmin-table-model";

/**
 * Manager class for handling table customizers
 * Implements a cross-bundle Singleton pattern by storing the instance on window
 */
export class CustomizeManager {
  private static instance: CustomizeManager | undefined;
  private customizers: ITableCustomizer[] = [];
  private activeCustomizers: Map<string, ITableCustomizer[]> = new Map();
  // debug id to detect duplicates
  private _instanceId: string;

  // Private constructor for singleton pattern
  private constructor() {
    this._instanceId = Math.random().toString(36).slice(2, 9);
  }

  /**
   * Get the singleton instance of the CustomizeManager.
   * This method checks window.__RADMIN_CUSTOMIZE_MANAGER to allow sharing the
   * instance across separately loaded bundles.
   */
  public static getInstance(): CustomizeManager {
    const win = (typeof window !== "undefined") ? (window as any) : undefined;

    // If an instance has already been stored on window by another bundle, reuse it
    if (win && win.__RADMIN_CUSTOMIZE_MANAGER) {
      if (!CustomizeManager.instance) {
        CustomizeManager.instance = win.__RADMIN_CUSTOMIZE_MANAGER;
      }
      return CustomizeManager.instance!;
    }

    if (!CustomizeManager.instance) {
      CustomizeManager.instance = new CustomizeManager();
      if (win) {
        win.__RADMIN_CUSTOMIZE_MANAGER = CustomizeManager.instance;
        // also expose a helper for debugging
        win.__RADMIN_CUSTOMIZE_MANAGER_ID = CustomizeManager.instance._instanceId;
      }
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
   * Register multiple customizers at once
   * @param customizers Array of customizers to register
   */
  public registerCustomizers(customizers: ITableCustomizer[]): void {
    customizers.forEach((customizer) => this.registerCustomizer(customizer));
  }

  /**
   * Apply customizations to the table configuration
   * @param config The original table configuration
   * @returns The modified table configuration
   */
  public customizeConfig(config: RadminTable): RadminTable {
    // Clear active customizers for this table
    this.activeCustomizers.delete(config.guid);

    let modifiedConfig = { ...config };
    const activeCustomizersForThisTable: ITableCustomizer[] = [];

    for (const customizer of this.customizers) {
      let shouldApply = false;
      try {
        shouldApply = customizer.shouldApply(config);
      } catch (err) {
        console.error(`[CustomizeManager] Error in shouldApply of ${customizer.constructor?.name}:`, err);
      }
      if (shouldApply) {
        activeCustomizersForThisTable.push(customizer);
        try {
          modifiedConfig = customizer.customizeConfig(modifiedConfig);
        } catch (err) {
          console.error(`[CustomizeManager] Error in customizeConfig of ${customizer.constructor?.name}:`, err);
        }
      }
    }

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
    const guid = String(configGuid);

    let modifiedOptions = { ...options };

    const customizersForThisTable = this.activeCustomizers.get(guid) || [];

    for (const customizer of customizersForThisTable) {
      try {
        modifiedOptions = customizer.customizeTabulator(modifiedOptions);
      } catch (err) {
      }
    }

    return modifiedOptions;
  }
}