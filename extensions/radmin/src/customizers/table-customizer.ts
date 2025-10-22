import type { Options } from "tabulator-tables";
import { RadminTableConfig } from "../configs/radmin-table-config";

/**
 * Interface for table customizers
 * All customizer implementations should implement this interface
 */
export interface TableCustomizer {
  /**
   * Method to determine if this customizer should be applied to the given configuration
   * @param config The table configuration
   * @returns True if the customizer should be applied, false otherwise
   */
  shouldApply(config: RadminTableConfig): boolean;

  /**
   * Method to customize the table configuration
   * @param config The original table configuration
   * @returns The modified table configuration
   */
  customizeConfig(config: RadminTableConfig): RadminTableConfig;

  /**
   * Method to customize the Tabulator options
   * @param options The original Tabulator options
   * @returns The modified Tabulator options
   */
  customizeTabulator(options: Options): Options;
}
