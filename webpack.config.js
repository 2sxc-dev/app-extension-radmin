const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env = {}) => {
  // Determine which entry to use
  let entry;
  let outDir = "dist";

  if (env.target === "table") {
    entry = {
      table: "./src/ts/table.ts",
      styles: "./src/styles/styles.scss"
    };
    outDir = `system/sxc-tables/dist`;
  } else if (env.target === "customizers") {
    entry = { customizers: "./src/ts/customizers.ts" };
    outDir = "dist";
  }
  return {
    entry,
    output: {
      globalObject: "self",
      path: path.resolve(__dirname, outDir),
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