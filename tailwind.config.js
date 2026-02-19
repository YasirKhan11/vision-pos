/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#17316c',
                    dark: '#112552',
                },
                secondary: '#f0f4f8',
                surface: '#ffffff',
                border: '#dde2e7',
                success: '#28a745',
                danger: '#dc3545',
            },
            fontFamily: {
                sans: ['Roboto', 'Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
