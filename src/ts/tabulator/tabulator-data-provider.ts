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
