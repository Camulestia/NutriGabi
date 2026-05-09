import nextVitals from "eslint-config-next/core-web-vitals";
import testingLibrary from "eslint-plugin-testing-library";
import vitest from "eslint-plugin-vitest";

const config = [
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    },
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "*.log",
      "tests/e2e/**",
      "tests/components/**/*.test.tsx"
    ]
  },
  ...nextVitals,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
      "import/no-anonymous-default-export": "off"
    }
  },
  {
    files: ["tests/unit/**/*.{ts,tsx}", "tests/components/**/*.{jsx,ts,tsx}"],
    plugins: {
      "testing-library": testingLibrary,
      vitest
    },
    rules: {
      ...testingLibrary.configs.react.rules,
      ...vitest.configs.recommended.rules
    }
  }
];

export default config;
