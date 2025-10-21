const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env = {}) => {
  // Log Info to Developer
  console.log("Building Radmin Extension JS/CSS");

  const entry = {
    tables: "./src/ts/tables.ts",
    styles: "./src/styles/styles.scss"
  };
  const outDir = 'extensions/radmin/dist';

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