import * as  ExtractTextPlugin from "extract-text-webpack-plugin"
import * as fs from "fs-extra"
import * as HtmlWebpackPlugin from "html-webpack-plugin"
import * as path from "path"
import * as webpack from "webpack"
import * as yargs from "yargs"
import { getConfig } from "./project-config"

const projectRootPath = yargs.argv.env.projectRootPath
const entryPath = yargs.argv.env.entryPath
const env = yargs.argv.env.env
const fileName = yargs.argv.env.fileName || "main"
const htmlTemplatePath = yargs.argv.env.htmlTemplatePath
const htmlTemplateArgs = yargs.argv.env.htmlTemplateArgs
const devServerPort = yargs.argv.env.devServerPort

const projectConfig = getConfig(projectRootPath, env)

// Override variable
const overridePublicPath = yargs.argv.env.publicPath
const overrideOutDir = yargs.argv.env.outDir

const outDir = overrideOutDir || path.join(projectRootPath, projectConfig.distDir)

let publicPath: string = overridePublicPath || projectConfig.publicPath || "/"
if (!publicPath.endsWith("/")) {
  publicPath += "/"
}

// TODO: any
const config: webpack.Configuration & any = {
  entry: entryPath,

  output: {
    path: outDir,
    filename: fileName + ".js",
    publicPath,
    chunkFilename: "[chunkhash].chunk.js",
  },

  module: {
    rules: [
      {
        test: /\.(tsx|ts)?$/, use: [{
          loader: "babel-loader",
          options: {
            presets: [
              ["env", {
                modules: false,
                targets: {
                  uglify: false
                }
              }],
              ["stage-2"]
            ],
            plugins: [
              ["transform-runtime"],
              ["dynamic-import-webpack"],
              ["import", {
                libraryName: "antd"
              }]
            ]
          }
        }, "ts-loader"]
      },
      {
        test: /\.css$/,
        use: env === "local" ?
          ["style-loader", "css-loader"] :
          ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: ["css-loader"]
          })
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      }
    ]
  },

  resolve: {
    modules: [
      // From project node_modules
      path.join(projectRootPath, "node_modules"),
      // Self node_modules
      path.join(__dirname, "../../node_modules")
    ],
    extensions: [".js", ".jsx", ".tsx", ".ts", ".scss", ".less", ".css"]
  },

  resolveLoader: {
    modules: [
      // From project node_modules
      path.join(projectRootPath, "node_modules"),
      // Self node_modules
      path.join(__dirname, "../../node_modules")
    ]
  },

  plugins: [],

  // Only for Devserver
  devServer: {
    historyApiFallback: {
      rewrites: [
        {
          from: "/",
          to: path.join(publicPath, "index.html")
        }
      ]
    },
    https: true,
    open: true,
    overlay: {
      warnings: true,
      errors: true
    },
    port: devServerPort,
    stats: {
      version: false,
      modules: false
    },
    clientLogLevel: "warning"
  }
}

if (env === "local") {
  if (htmlTemplatePath) {
    config.plugins.push(
      new HtmlWebpackPlugin({
        title: "Pre Dev",
        filename: "index.html",
        template: htmlTemplatePath,
        htmlTemplateArgs
      })
    )
  }
}

if (env === "prod") {
  config.plugins.push(new ExtractTextPlugin(fileName + ".css"))
}

export default config