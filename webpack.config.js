const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

/**
 * Two bundles with React 19 and MUI 7, the same stack as the Text to Speech and
 * Media Cleanup admin screens:
 * - reinventwp-apps.js: the Reinvent WP Apps page (the app cards);
 * - bot.js: the assistant, standalone, on the Apps page, the approved plugins' own
 *   pages and reinventwp.com (copied to reinventwp-next/public/bot by `npm run build`).
 *
 * `npm run dev` serves dev/index.html with the local site's real data (dev/data.js)
 * on http://localhost:3017 and reloads on every change.
 */
module.exports = (_env, argv) => {
  const isDev = argv.mode === "development";
  return {
    mode: isDev ? "development" : "production",
    devtool: isDev ? "eval-source-map" : false,
    entry: { "reinventwp-apps": "./src/index.tsx", bot: "./src/bot/index.tsx" },
    output: {
      path: path.resolve(__dirname, "build"),
      filename: "[name].js",
      clean: true,
    },
    module: {
      rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: "ts-loader" }],
    },
    resolve: { extensions: [".ts", ".tsx", ".js"] },
    plugins: isDev ? [new HtmlWebpackPlugin({ template: path.resolve(__dirname, "dev/index.html") })] : [],
    devServer: {
      port: 3017,
      hot: true,
      static: { directory: path.resolve(__dirname, "dev") },
    },
    optimization: {
      minimizer: [new TerserPlugin({ extractComments: false, terserOptions: { format: { comments: false } } })],
    },
    performance: { hints: false },
  };
};
