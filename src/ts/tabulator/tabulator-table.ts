import { TabulatorAdapter } from "./tabulator-adapter";
import { ConfigurationLoader } from "../loaders/table-configuration-loader";
import { TabulatorDataProvider } from "./tabulator-data-provider";
import { QueryTabulatorDataProvider } from "./tabulator-query-data-provider";

export class tabulatorTable {
  /**
   * Create a Tabulator table based on configuration
   */
  async createTabulatorTable(data: {
    tableName: string;
    filterName: string;
    moduleId: number;
    viewId: string;
  }) {
    // Get sxc context
    const sxc = $2sxc(data.moduleId);

    // Use viewid from URL if available, otherwise use the one provided by the Razor file
    const urlParams = new URLSearchParams(window.location.search);
    const viewIdFromParams = urlParams.get("viewid");
    const viewId = viewIdFromParams ? viewIdFromParams : data.viewId;

    // Load table configuration with ConfigurationLoader
    const configLoader = new ConfigurationLoader(sxc);
    const tableConfigData = await configLoader.loadConfig(viewId);

    // Handle link parameters
    let linkParameters: string | undefined;
    if (urlParams.has("viewconfigmode")) {
      linkParameters = undefined;
    } else {
      const linkParametersFromParams = urlParams
        .toString()
        .replace(/(^|&)viewid=[^&]*/g, "")
        .replace(/^&/, "");
      linkParameters = linkParametersFromParams
        ? linkParametersFromParams
        : undefined;
    }

    // Create the Tabulator adapter
    const tabulatorAdapter = new TabulatorAdapter();

    if (tableConfigData.dataQuery === "") {
      // Configure API URL for data content type
      const apiUrl = sxc.webApi.url(
        `/api/2sxc/app/auto/data/${tableConfigData.dataContentType}`
      );
      const headers = await sxc.webApi.headers("GET");

      // Create standard data provider
      const dataProvider = new TabulatorDataProvider(
        apiUrl,
        headers,
        tableConfigData.dataContentType
      );

      // Create table with remote data loading
      await tabulatorAdapter.createTable(
        data.tableName,
        tableConfigData,
        dataProvider,
        data.filterName
      );
    }
    else {
      // Create a query data provider that handles relationships
      const queryProvider = new QueryTabulatorDataProvider(
        sxc,
        tableConfigData.dataQuery,
        linkParameters
      );

      await tabulatorAdapter.createTable(
        data.tableName,
        tableConfigData,
        queryProvider,
        data.filterName
      );
    }
  }
}
