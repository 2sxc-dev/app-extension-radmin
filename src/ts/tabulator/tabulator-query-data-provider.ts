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

    super(apiUrl, {}); // headers will be fetched asynchronously
    this.sxc = sxc;
    this.query = query;
    this.linkParameters = linkParameters;
  }

  /**
   * Initialize the provider (fetch headers)
   */
  async initialize(): Promise<void> {
    const headers = await this.sxc.webApi.headers("GET");
    this.updateHeaders(headers);
  }

  /**
   * Override getInitialData to include relationship processing
   */
  async getInitialData(): Promise<any[]> {
    try {
      let endpoint = `app/auto/query/${this.query}`;
      if (this.linkParameters) {
        endpoint += `?${this.linkParameters}`;
      }

      const data = await this.sxc.webApi.fetchJson(endpoint);
      return this.processQueryData(data, this.query);
    } catch (error) {
      console.error(`Error loading data from query ${this.query}:`, error);
      return [];
    }
  }

  /**
   * Override response processor to handle relationships
   */
  getResponseProcessor() {
    return (url: string, params: any, response: any) => {
      const data =
        typeof response === "string" ? JSON.parse(response) : response;
      const processedData = this.processQueryData(data, this.query);

      return {
        data: processedData,
        last_page:
          Math.ceil(
            (data.TotalItems || processedData.length) / (data.PageSize || 10)
          ) || 1,
      };
    };
  }

  /**
   * Process query data to handle relationships
   */
  private processQueryData(data: any, queryName: string): any[] {
    const mainKey = queryName;
    let mainItems = data[mainKey] || data["Default"];
    if (!Array.isArray(mainItems)) return [];

    // Build lookup maps for each array with an "Id" property
    const lookupMaps: Record<string, Record<number, any>> = {};
    for (const key of Object.keys(data)) {
      if (key === mainKey) continue;
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
    }

    // Flatten relationships
    return mainItems.map((item: any) => {
      const newItem = { ...item };
      for (const field of Object.keys(newItem)) {
        if (lookupMaps[field] && Array.isArray(newItem[field])) {
          newItem[field] =
            newItem[field].length > 0
              ? lookupMaps[field][newItem[field][0].Id] || newItem[field][0]
              : null;
        }
      }
      return newItem;
    });
  }
}
