import { Sxc } from "@2sic.com/2sxc-typings";

export class DataContentLoader {
  private sxc: Sxc;

  constructor(sxc: Sxc) {
    this.sxc = sxc;
  }

  async loadDataContent(contentType: string): Promise<any[]> {
    try {
      // Pull data from your DNN/2sxc data endpoint
      return await this.sxc.webApi.fetchJson(`app/auto/data/${contentType}/`);
    } catch (err) {
      console.error(
        `Error loading data from app/auto/data/${contentType}/`,
        err
      );
      return [];
    }
  }

  async loadQueryDataContent(query: string, linkParameters?: string): Promise<any[]> {
    try {
      // Build endpoint URL including linkParameters if provided.
      let endpoint = `app/auto/query/${query}`;
      if (linkParameters)
        endpoint += `?${linkParameters}`;

      // Fetch data from the endpoint using the query string.
      const data = await this.sxc.webApi.fetchJson(endpoint);

      // Determine the main items using the provided query key.
      // If the key isn’t found, return [].
      let mainKey = query;
      let mainItems = data[mainKey] || data["Default"];
      if (!Array.isArray(mainItems)) return [];

      // Build lookup maps for every other property that returns an array
      // with reference objects (i.e. those with an "Id" property).
      const lookupMaps: Record<string, Record<number, any>> = {};
      Object.keys(data).forEach((key) => {
        // Skip the main key.
        if (key === mainKey) return;
        const arr = data[key];
        if (
          Array.isArray(arr) &&
          arr.length > 0 &&
          arr[0] &&
          Object.prototype.hasOwnProperty.call(arr[0], "Id")
        ) {
          lookupMaps[key] = arr.reduce(
            (map: Record<number, any>, item: any) => {
              map[item.Id] = item;
              return map;
            },
            {}
          );
        }
      });

      // Process each record in the main array.
      // For every property in the record that is an array, check if a corresponding lookup map exists
      // (using the same field name) and, if so, flatten the array by replacing it with the looked-up object.
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

      console.log("After joining:", combined);
      return combined;
    } catch (err) {
      console.error(`Error loading data from app/auto/query/${query}`, err);
      return [];
    }
  }
}
