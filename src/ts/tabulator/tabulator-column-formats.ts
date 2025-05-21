import { TabulatorColumnConfig } from "./tabulator-models";

export const formatConfigs: Record<string, Partial<TabulatorColumnConfig>> = {
  "": {},
  number: {
    hozAlign: "right",
  },
  boolean: {
    hozAlign: "center",
    formatter: "tickCross",
  },
  date: {
    hozAlign: "right",
    formatter: "datetime",
    formatterParams: {
      inputFormat: "yyyy-MM-dd'T'HH:mm:ss'Z'",
      outputFormat: "dd/MM/yy",
    },
  },
  "date-time": {
    hozAlign: "right",
    formatter: "datetime",
    formatterParams: {
      inputFormat: "yyyy-MM-dd'T'HH:mm:ss'Z'",
      outputFormat: "dd/MM/yy HH:mm:ss",
    },
  },
  time: {
    hozAlign: "right",
    formatter: "datetime",
    formatterParams: {
      inputFormat: "yyyy-MM-dd'T'HH:mm:ss'Z'",
      outputFormat: "HH:mm:ss",
    },
  },
};
