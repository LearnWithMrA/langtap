// ------------------------------------------------------------
// File: postcss.config.mjs
// Purpose: PostCSS configuration for Tailwind CSS v4.
//          Uses @tailwindcss/postcss instead of the v3 tailwindcss plugin.
// Depends on: tailwindcss@^4, @tailwindcss/postcss@^4
// ------------------------------------------------------------

export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
