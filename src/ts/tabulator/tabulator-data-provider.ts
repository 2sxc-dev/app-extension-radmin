export class TabulatorDataProvider {
  private apiUrl: string;
  private headers: Record<string, string>;

  constructor(apiUrl: string, headers: Record<string, string>) {
    this.apiUrl = apiUrl;
    this.headers = headers;
  }

  getAjaxRequestFunc() {
    return async () => {
      try {
        // Fetch data from the API
        const response = await fetch(this.apiUrl, {
          method: "GET",
          headers: this.headers,
        });

        return await response.json() as object[];
      } catch (error) {
        console.error("Error fetching data:", error);
        return [];
      }
    };
  }
}
