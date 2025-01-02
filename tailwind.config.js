/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html"
    ],
    theme: {
      extend: {
        colors: {
          'game-primary': '#4CAF50',
          'game-secondary': '#FF5252',
          'game-dark': '#1E1E1E',
        },
        animation: {
          'recoil': 'recoil 0.2s ease-in-out',
        },
        keyframes: {
          recoil: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
          }
        },
        spacing: {
        '2.5': '0.625rem',
        },
      },
    },
    plugins: [
      require('@tailwindcss/forms'),
      require('@tailwindcss/typography'),
    ],
  }