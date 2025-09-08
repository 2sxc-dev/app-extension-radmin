import { Sxc } from "@2sic.com/2sxc-typings";
import { JsonSchema } from "../models/json-schema";

export class SchemaProvider {
  private sxc: Sxc;

  constructor(sxc: Sxc) {
    this.sxc = sxc;
  }

  /**
   * Fetches the schema for a given content type
   * @param typeName The name of the content type
   * @returns A promise that resolves to the schema
   */
  async getSchema(typeName: string): Promise<JsonSchema> {
    try {
      return await this.sxc.webApi.fetchJson(
        `app/auto/api/radmin/schema?typename=${encodeURIComponent(
          typeName
        )}`
      );
    } catch (error) {
      console.error("Error fetching schema:", error);
      throw error;
    }
  }
}
