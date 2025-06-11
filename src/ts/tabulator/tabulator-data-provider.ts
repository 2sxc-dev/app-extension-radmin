import { AjaxConfig, HttpMethod } from "tabulator-tables";

export class TabulatorDataProvider {
  protected apiUrl: string;
  protected headers: Record<string, string>;
  protected dataContentType?: string;

  constructor(
    apiUrl: string,
    headers: Record<string, string>,
    dataContentType?: string
  ) {
    this.apiUrl = apiUrl;
    this.headers = headers;
    this.dataContentType = dataContentType;
  }

  /**
   * Get the API URL
   */
  getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Update the API URL
   */
  updateApiUrl(url: string): void {
    this.apiUrl = url;
  }

  /**
   * Update headers
   */
  updateHeaders(headers: Record<string, string>): void {
    Object.assign(this.headers, headers);
  }

  /**
   * Get the AJAX configuration for Tabulator
   */
  getAjaxConfig(): AjaxConfig {
    return {
      method: "GET" as HttpMethod,
      headers: this.headers,
    };
  }

  /**
   * Get URL generator function for Tabulator
   */
  getUrlGenerator() {
    return (url: string, config: any, params: any): string => {
      const queryParams = new URLSearchParams();

      // Add pagination parameters
      if (params.page !== undefined) {
        queryParams.append("page", params.page.toString());
        queryParams.append("size", params.size.toString());
      }

      // Add sorting parameters
      if (params.sorters && params.sorters.length > 0) {
        params.sorters.forEach((sorter: any) => {
          queryParams.append("sort", `${sorter.field},${sorter.dir}`);
        });
      }

      // Optionally add a search term
      if (params.searchTerm) {
        queryParams.append("search", params.searchTerm);
      }

      const queryString = queryParams.toString();
      return queryString ? `${url}?${queryString}` : url;
    };
  }

  /**
   * Get response processor function for Tabulator
   */
  getResponseProcessor() {
    return (url: string, params: any, response: any) => {
      const data =
        typeof response === "string" ? JSON.parse(response) : response;

      // Handle different response formats
      if (Array.isArray(data)) {
        return {
          data: data,
          last_page: 1,
        };
      } else if (data.Resources) {
        return {
          data: data.Resources,
          last_page:
            Math.ceil(
              (data.TotalItems || data.Resources.length) / data.PageSize
            ) || 1,
        };
      } else {
        return {
          data: data.items || data,
          last_page: data.totalPages || 1,
        };
      }
    };
  }

  /**
   * Get initial data for table setup
   */
  async getInitialData() {
    try {
      const response = await fetch(this.apiUrl, {
        method: "GET",
        headers: this.headers,
      });
      const data = await response.json();

      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data.Resources) {
        return data.Resources;
      } else {
        return data.items || data;
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      return [];
    }
  }
}
