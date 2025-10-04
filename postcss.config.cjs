// postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // ✅ بدل tailwindcss: {}
    // autoprefixer: {}  // (اختياري) Next بيضيفه تلقائيًا؛ سيبه فاضي لو عايز
  },
}
