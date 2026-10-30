/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#07090b",
        espresso: "#15100e",
        abyss: "#093533",
        cyan: { DEFAULT: "#0cc4bb", deep: "#079a93" },
        aqua: "#a2f2ee",
        chrome: "#c9d1d8",
        ink: "#e9f2f2",
        mute: "#93abac",
        onCyan: "#021d1c",
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
