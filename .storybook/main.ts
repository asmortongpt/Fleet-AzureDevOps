import type { StorybookConfig } from "@storybook/react-vite"
import { join, dirname } from "path"

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")))
}

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../.storybook/**/*.mdx",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@storybook/addon-a11y"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  core: {
    disableTelemetry: true,
  },
  async viteFinal(config) {
    // Customize the Vite config here
    return {
      ...config,
      define: {
        ...config.define,
        // Add any environment variables needed for stories
        "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(
          process.env.VITE_GOOGLE_MAPS_API_KEY || ""
        ),
      },
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          "@": join(__dirname, "../src"),
        },
      },
    }
  },
}

export default config
