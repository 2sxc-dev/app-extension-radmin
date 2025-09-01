import { TabulatorAdapter } from "./tabulator-adapter";
import { ConfigurationLoader } from "../loaders/table-configuration-loader";
import { DataProvider } from "../providers/data-provider";
import { QueryDataProvider } from "../providers/query-data-provider";
import { TabulatorSearchFilter } from "./tabulator-search-filter";
import { SchemaProvider } from "../providers/schema-provider";
import { CustomizeManager } from "../custom/customize-manager";

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
    const tableConfigDataRaw = await configLoader.loadConfig(viewId);

    // Get the CustomizeManager instance
    const customizeManager = CustomizeManager.getInstance();

    // Apply customizations to the config
    const tableConfigData =
      customizeManager.customizeConfig(tableConfigDataRaw);

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

    // Create the filter input if search is enabled
    if (tableConfigData.search) {
      const searchFilter = new TabulatorSearchFilter();
      searchFilter.createFilterInput(
        data.tableName,
        data.filterName,
        data.moduleId
      );
    }

    // Create the Tabulator adapter
    const tabulatorAdapter = new TabulatorAdapter();

    let dataProvider: DataProvider;

    if (tableConfigData.dataQuery === "") {
      // Configure API URL for data content type
      const apiUrl = sxc.webApi.url(
        `app/auto/data/${tableConfigData.dataContentType}`
      );
      const headers = sxc.webApi.headers("GET");

      // Create standard data provider
      dataProvider = new DataProvider(
        apiUrl,
        headers,
        tableConfigData.dataContentType
      );
    } else {
      // Create a query data provider that handles relationships
      dataProvider = new QueryDataProvider(
        sxc,
        tableConfigData.dataQuery,
        linkParameters
      );
    }
    
    const schemaProvider = new SchemaProvider(sxc);

    // Create table with remote data loading
    await tabulatorAdapter.createTable(
      data.tableName,
      tableConfigData,
      dataProvider,
      schemaProvider,
      data.filterName,
      customizeManager
    );
  }
}
