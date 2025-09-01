const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env = {}) => {
  // Use env.target to select which entry to use
  let entry;
  if (env.target === "table") {
    entry = { table: "./src/ts/table.ts" };
  } else if (env.target === "customizers") {
    entry = { customizers: "./src/ts/customizers.ts" };
  } else {
    entry = {
      table: "./src/ts/table.ts",
      customizers: "./src/ts/customizers.ts",
    };
  }

  return {
    entry: {
      ...entry,
      styles: "./src/styles/styles.scss",
    },
    output: {
      globalObject: "self",
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
    },
    mode: "development",
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            {
              loader: "sass-loader",
              options: {
                sassOptions: {
                  includePaths: ["node_modules"],
                },
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js", ".css", ".scss"],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "[name].min.css",
      }),
    ],
  };
};