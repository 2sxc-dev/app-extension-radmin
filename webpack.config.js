const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    styles: "./src/styles/styles.scss",
    scripts: "./src/ts/index.ts",
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
