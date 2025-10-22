import { Sxc } from "@2sic.com/2sxc-typings";
import { RadminTableConfig } from "../configs/radmin-table-config";

export class ConfigurationLoader {
  private sxc: Sxc;

  constructor(sxc: Sxc) {
    this.sxc = sxc;
  }

  /**
   * Load the table configuration from the server using the provided viewId.
   */
  async loadConfig(viewId: string): Promise<RadminTableConfig> {
    try {
      return await this.sxc.webApi.fetchJson(
        `app/auto/api/radmin/table?viewId=${viewId}`
      );
    } catch (err) {
      console.error("Error loading table config:", err);
      return {} as RadminTableConfig;
    }
  }
}
