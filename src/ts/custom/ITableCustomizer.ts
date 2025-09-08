import { Options } from "tabulator-tables";
import { RadminTable } from "../models/radmin-table";

/**
 * Interface for table customizers
 * All customizer implementations should implement this interface
 */
export interface ITableCustomizer {
  /**
   * Method to determine if this customizer should be applied to the given configuration
   * @param config The table configuration
   * @returns True if the customizer should be applied, false otherwise
   */
  shouldApply(config: RadminTable): boolean;
  
  /**
   * Method to customize the table configuration
   * @param config The original table configuration
   * @returns The modified table configuration
   */
  customizeConfig(config: RadminTable): RadminTable;
  
  /**
   * Method to customize the Tabulator options
   * @param options The original Tabulator options
   * @returns The modified Tabulator options
   */
  customizeTabulator(options: Options): Options;
}