// Add this to your webpack configuration
module.exports = {
  // ... other webpack config
  module: {
    rules: [
      // ... other rules
      {
        test: /\.worker\.js$/,
        use: { 
          loader: 'worker-loader',
          options: { 
            inline: 'no-fallback' 
          }
        }
      }
    ]
  }
};