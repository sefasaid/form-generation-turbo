const { join } = require('path');

module.exports = {
  entry: './src/main.ts',
  target: 'node',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  output: {
    path: join(__dirname, 'dist'),
    filename: 'main.js',
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@repo/prisma': join(__dirname, '../../packages/prisma/src'),
      '@repo/prisma-module': join(__dirname, '../../packages/prisma/src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.app.json',
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    '@nestjs/common': 'commonjs @nestjs/common',
    '@nestjs/core': 'commonjs @nestjs/core',
    'pg-native': 'commonjs pg-native',
    'bufferutil': 'commonjs bufferutil',
    'utf-8-validate': 'commonjs utf-8-validate',
  },
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  watch: process.env.NODE_ENV !== 'production',
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    poll: 1000,
  },
};