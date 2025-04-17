import { FlatCompat } from "@eslint/eslintrc"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript", "prettier"],
    parser: "@typescript-eslint/parser",
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-explicit-any": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      quotes: ["error", "double"],
      semi: ["error", "never"],
    },
  }),
]

export default eslintConfig
