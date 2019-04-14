var CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = function (config) {
  config.module.rules.push({
    test: /\.(html)$/,
    use: [{
        loader: "@skpm/extract-loader",
      },
      {
        loader: "html-loader",
        options: {
          attrs: [
            'img:src',
            'link:href'
          ],
          interpolate: true,
        },
      },
    ]
  })
  config.module.rules.push({
    test: /\.(css)$/,
    use: [{
        loader: "@skpm/extract-loader",
      },
      {
        loader: "css-loader",
      },
    ]
  })
  // Do some extra lifting when building the webview
  if (config.entry && config.entry.includes('webview.js')) {
    config.plugins.push(
      new CopyWebpackPlugin([
        { from: './resources/styles.light.css', to: config.output.path },
        { from: './resources/styles.dark.css', to: config.output.path },
        { from: './assets/icon.png', to: config.output.path },
      ]))
  }
}
