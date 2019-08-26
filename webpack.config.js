const path = require('path');
const WebpackShellPlugin = require('webpack-shell-plugin');
const WebpackCopyPlugin = require('copy-webpack-plugin');
var plugins = [];
plugins.push(
  new WebpackShellPlugin({
    onBuildStart: ['echo "Starting build by webpack"'],
    onBuildEnd: ['node ./dist/bundle.js']
  })
);
// plugins.push(new WebpackCopyPlugin([
//     { from: 'lib/data', to: 'data' }
// ]));
module.exports = {
  entry: './server/server.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  target: 'node',
  watch: false,
  plugins: plugins,
  node: {
    __dirname: false, //giữ nguyên the regular Node.js __dirname behavior
    __filename: false
  }
};
