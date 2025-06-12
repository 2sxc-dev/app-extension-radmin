import { HttpMethod } from "tabulator-tables";

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
   * Get the headers for AJAX requests
   */
  getHeaders(): Record<string, string> {
    return this.headers;
  }

  /**
   * Update headers
   */
  updateHeaders(headers: Record<string, string>): void {
    this.headers = headers;
  }

  /**
   * Process raw data without fetching it - can be used by ajaxResponse
   */
  processData(data: string): any {
    return data;
  }

  /**
   * Get the AJAX configuration for Tabulator
   */
  getAjaxConfig() {
    return {
      method: "GET" as HttpMethod,
      headers: this.headers,
    };
  }

  /**
   * Get initial data for table setup
   */
  async getInitialData() {
    try {
      const response = await fetch(this.apiUrl, this.getAjaxConfig());
      return await response.json();
    } catch (error) {
      console.error("Error fetching initial data:", error);
      return [];
    }
  }
}
