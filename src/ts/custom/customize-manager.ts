// Manager for table customizers (no longer relies on window)
import { Options } from "tabulator-tables";
import { ITableCustomizer } from "./ITableCustomizer";
import { RadminTable } from "../models/radmin-table-model";

export class CustomizeManager {
  private static instance: CustomizeManager | undefined;
  private customizers: ITableCustomizer[] = [];
  private activeCustomizers: Map<string, ITableCustomizer[]> = new Map();
  private registeredIds: Set<string> = new Set();
  // debug id to detect duplicates
  private _instanceId: string;

  private constructor() {
    this._instanceId = Math.random().toString(36).slice(2, 9);
  }

  /**
   * Get the singleton instance of the CustomizeManager.
   * This is a plain static singleton (does not use window).
   */
  public static getInstance(): CustomizeManager {
    if (!CustomizeManager.instance) {
      CustomizeManager.instance = new CustomizeManager();
    }
    return CustomizeManager.instance!;
  }

  /**
   * Register a customizer with the manager. Will dedupe by constructor name by default.
   * If you need a different dedupe key, customizers can expose an `id` string property.
   */
  public registerCustomizer(customizer: ITableCustomizer & { id?: string }): void {
    try {
      const id = customizer.id ?? customizer.constructor?.name ?? String(this.customizers.length);
      if (this.registeredIds.has(id)) {
        // already registered — ignore duplicate registrations
        return;
      }
      this.registeredIds.add(id);
      this.customizers.push(customizer);
    } catch (err) {
      console.error("[CustomizeManager] registerCustomizer error:", err);
    }
  }

  public registerCustomizers(customizers: Array<ITableCustomizer & { id?: string }>): void {
    customizers.forEach((c) => this.registerCustomizer(c));
  }

  public getRegisteredCustomizers(): ITableCustomizer[] {
    return [...this.customizers];
  }

  /**
   * Apply customizations to the table configuration
   * @param config The original table configuration
   * @returns The modified table configuration
   */
  public customizeConfig(config: RadminTable): RadminTable {
    // Clear any previously stored active list for this table
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
        console.error(`[CustomizeManager] Error in customizeTabulator of ${customizer.constructor?.name}:`, err);
      }
    }

    return modifiedOptions;
  }
}