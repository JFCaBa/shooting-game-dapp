module.exports = {
    extends: [
      "react-app",
      "react-app/jest"
    ],
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": "warn"
    },
    devServer: {
      port: 4000,
      hot: true,
      client: {
        webSocketURL: false, // Disable webpack dev server WebSocket
      }
    }
  };