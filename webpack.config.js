module.exports = (options, webpack) => {
  return {
    ...options,
    entry: './src/serverless.ts',
    output: {
      ...options.output,
      libraryTarget: 'commonjs2',
      filename: 'serverless.js',
    },
    target: 'node',
    externals: [],
    optimization: {
      minimize: false,
    },
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          return /^pg-native$/.test(resource);
        },
      }),
    ],
  };
};