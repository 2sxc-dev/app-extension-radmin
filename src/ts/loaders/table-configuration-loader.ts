import { Sxc } from "@2sic.com/2sxc-typings";
import { DataViewTableConfig } from "../models/data-view-table-config";

export class ConfigurationLoader {
  private sxc: Sxc;

  constructor(sxc: Sxc) {
    this.sxc = sxc;
  }

  /**
   * Load the table configuration from the server using the provided viewId.
   */
  async loadConfig(viewId: string): Promise<DataViewTableConfig> {
    try {
      return await this.sxc.webApi.fetchJson(
        `app/auto/api/TableConfig/GetData?viewId=${viewId}`
      );
    } catch (err) {
      console.error("Error loading table config:", err);
      return {} as DataViewTableConfig;
    }
  }
}