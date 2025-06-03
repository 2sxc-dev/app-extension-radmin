import { TabulatorAdapter } from "./tabulator-adapter";
import { DataContentLoader } from "../data-content-loader";
import { ConfigurationLoader } from "../table-configuration-loader";
import { TabulatorDataProvider } from "./tabulator-data-provider";

export class tabulatorTable {
  // This method is called from a Razor-File
  async createTabulatorTable(data: {
    name: string;
    entries: object[];
    moduleId: number;
    viewId: string;
  }) {
    // Get sxc context
    const sxc = $2sxc(data.moduleId);

    // Use viewid from URL if available, otherwise use the one provided by the Razor file
    const urlParams = new URLSearchParams(window.location.search);
    const viewIdFromParams = urlParams.get("viewid");
    const viewId = viewIdFromParams ? viewIdFromParams : data.viewId;
    let linkParameters: string | undefined;
    if (urlParams.has("viewconfigmode")) { // Ensure that the viewconfigmode is not accidentally used as a link parameter
      linkParameters = undefined;
    } else {
      const linkParametersFromParams = urlParams.toString().replace(/(^|&)viewid=[^&]*/g, "").replace(/^&/, "");
      linkParameters = linkParametersFromParams ? linkParametersFromParams : undefined;
    }

    // Load table configuration with ConfigurationLoader
    const configLoader = new ConfigurationLoader(sxc);
    const tableConfigData = await configLoader.loadConfig(viewId);
    const resourceLoader = new DataContentLoader(sxc);

    // Now create & initialize the Tabulator table
    const tabulatorAdapter = new TabulatorAdapter();
    
    // If a linkParameters is provided, use it in the query to load data via GUID filtering
    if (linkParameters) {
      const contentsData = await resourceLoader.loadQueryDataContent(
        tableConfigData.dataQuery,
        linkParameters
      );
      const resources = Array.isArray(contentsData)
        ? contentsData
        : (contentsData as { Resources: object[] }).Resources;
      await tabulatorAdapter.createTableOnPromise(
        data.name,
        tableConfigData,
        resources
      );
    }
    // If no linkParameters is provided, treat it normally
    else {
      // When no query is provided, load the content via API (v2)
      if (tableConfigData.dataQuery === "") {
        const apiUrl = sxc.webApi.url(
          `/api/2sxc/app/auto/data/${tableConfigData.dataContentType}`
        );
        const headers = await sxc.webApi.headers("GET");
        const dataProvider = new TabulatorDataProvider(apiUrl, headers);
        await tabulatorAdapter.createTable(
          data.name,
          tableConfigData,
          dataProvider
        );
      }
      // Otherwise load content data with a Query (v1)
      else {
        const contentsData = await resourceLoader.loadQueryDataContent(
          tableConfigData.dataQuery
        );
        const resources = Array.isArray(contentsData)
          ? contentsData
          : (contentsData as { Resources: object[] }).Resources;
        await tabulatorAdapter.createTableOnPromise(
          data.name,
          tableConfigData,
          resources
        );
      }
    }
  }
}
