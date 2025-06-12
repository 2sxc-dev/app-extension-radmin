import { TabulatorDataProvider } from "./tabulator-data-provider";
import { Sxc } from "@2sic.com/2sxc-typings";

export class QueryTabulatorDataProvider extends TabulatorDataProvider {
  private sxc: Sxc;
  private query: string;
  private linkParameters?: string;

  constructor(sxc: Sxc, query: string, linkParameters?: string) {
    // Build the full API URL
    const endpoint = `app/auto/query/${query}${
      linkParameters ? `?${linkParameters}` : ""
    }`;
    const apiUrl = sxc.webApi.url(endpoint);

    // Initialize the base provider
    super(apiUrl, sxc.webApi.headers("GET"));

    // Store references for later use
    this.sxc = sxc;
    this.query = query;
    this.linkParameters = linkParameters;
  }

  /**
   * Override getInitialData to include relationship processing
   */
  async getInitialData(): Promise<any[]> {
    try {
      // Build endpoint URL including linkParameters if provided
      let endpoint = `app/auto/query/${this.query}`;
      if (this.linkParameters) {
        endpoint += `?${this.linkParameters}`;
      }

      // Fetch data from the endpoint using the query string
      const data = await this.sxc.webApi.fetchJson(endpoint);

      // Process the data with relationship handling
      return this.processQueryData(data, this.query);
    } catch (error) {
      console.error(`Error loading data from query ${this.query}:`, error);
      return [];
    }
  }

  /**
   * Process query data to handle relationships
   */
  private processQueryData(data: any, queryName: string): any[] {
    // Determine the main items using the provided query key
    let mainKey = queryName;
    let mainItems = data[mainKey] || data["Default"];

    if (!Array.isArray(mainItems)) return [];

    // Build lookup maps for every other property that returns an array
    // with reference objects (i.e. those with an "Id" property)
    const lookupMaps: Record<string, Record<number, any>> = {};
    Object.keys(data).forEach((key) => {
      // Skip the main key
      if (key === mainKey) return;
      const arr = data[key];
      if (
        Array.isArray(arr) &&
        arr.length > 0 &&
        arr[0] &&
        Object.prototype.hasOwnProperty.call(arr[0], "Id")
      ) {
        lookupMaps[key] = arr.reduce((map: Record<number, any>, item: any) => {
          map[item.Id] = item;
          return map;
        }, {});
      }
    });

    // Process each record in the main array
    // For every property in the record that is an array, check if a corresponding lookup map exists
    // (using the same field name) and, if so, flatten the array by replacing it with the looked-up object
    const combined = mainItems.map((item: any) => {
      const newItem: any = { ...item };
      Object.keys(newItem).forEach((field) => {
        if (lookupMaps[field] && Array.isArray(newItem[field])) {
          newItem[field] =
            newItem[field].length > 0
              ? lookupMaps[field][newItem[field][0].Id] || newItem[field][0]
              : null;
        }
      });
      return newItem;
    });

    return combined;
  }
}
