import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  { ignores: ['.next/**', 'public/sw.js', 'public/swe-worker-*.js', 'app/sw.js', 'next-env.d.ts'] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
