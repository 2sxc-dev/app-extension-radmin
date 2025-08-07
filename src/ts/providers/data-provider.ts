export class DataProvider {
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
 processData(data: any): any {
    // For arrays (normal content-type data), normalize keys to lowerCamelCase
    if (Array.isArray(data)) {
      return data.map((row: any) => {
        const newRow: any = {};
        Object.entries(row).forEach(([key, value]) => {
          const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
          newRow[camelKey] = value;
        });
        return newRow;
      });
    }
    // For all other cases (leave as is)
    return data;
  }

  /**
   * Get the AJAX configuration
   */
  getAjaxConfig() {
    return {
      method: "GET",
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
