const TranslationsPlugin = require("./TranslationsPlugin");

/** @type {import('next').NextConfig} */
const nextConfig = {

  webpack: (
    /** @type {import('next/dist/server/config-shared').NextJsWebpackConfig} */
    config,
    context
  ) => {
    if (config.name === "client") {
        config.plugins.push(new TranslationsPlugin());
    }
    return config;
  },
  
};

module.exports = nextConfig;