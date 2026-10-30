/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#07090b",
        espresso: "#15100e",
        abyss: "#0b2e33",
        cyan: { DEFAULT: "#1ec8da", deep: "#0fa3b3" },
        aqua: "#a6eee0",
        chrome: "#c9d1d8",
        ink: "#e9f2f1",
        mute: "#93abac",
        onCyan: "#03191c",
        line: "rgba(201, 209, 216, 0.16)",
        danger: "#ff9a86",
      },
      fontFamily: {
        logo: ['"UnifrakturMaguntia"', '"Old English Text MT"', "Georgia", "serif"],
        display: ['"Silkscreen"', "ui-monospace", '"Courier New"', "monospace"],
        pixel: ['"Silkscreen"', "ui-monospace", '"Courier New"', "monospace"],
        body: ['"Silkscreen"', "ui-monospace", '"Courier New"', "monospace"],
      },
      borderRadius: {
        ctl: "6px",
        win: "8px",
      },
      maxWidth: { page: "1180px" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
