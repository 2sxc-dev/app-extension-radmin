const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env = {}) => {
  // Log Info to Developer
  console.log("Building Radmin Customizers JS/CSS");

  const entry = {
    customizers: "./src/ts/customizers.ts"
  };
  const outDir = 'dist';

  return {
    entry,
    output: {
      path: path.resolve(__dirname, outDir),
      filename: "[name].js",
      // Proper ES modules configuration
      library: {
        type: "module"
      },
      environment: {
        module: true
      },
      publicPath: 'auto'
    },
    experiments: {
      outputModule: true
    },
    mode: "development",
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: "ts-loader",
            options: {
              compilerOptions: {
                // Override target to es2022
                target: "es2022",
                module: "es2022"
              }
            }
          },
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