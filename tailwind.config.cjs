/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "src/**/*.{html,svelte,js,ts,jsx,tsx}",
    ],
    darkMode: 'media',
    theme: {
        extend: {
            colors: {
                accent: {
                    DEFAULT: '#1a73e8',
                    hover: '#3081ea',
                    pale: '#8ab4f8',
                    palehover: '#7fa6e5',
                },
                background: {
                    DEFAULT: '#ffffff',
                    dark: '#202124',
                },
                input: {
                    DEFAULT: '#f1f3f4',
                    dark: '#202124',
                },
                pane: {
                    DEFAULT: '#f8f9fa',
                    dark: '#292a2d',
                },
                chromegrey: {
                    DEFAULT: '#5f6368',
                    pale: '#dadce0',
                },
                chromeblue: {
                    DEFAULT: '#1a73e8',
                    pale: '#8ab4f8',
                },
                chromered: {
                    DEFAULT: '#d93025',
                    pale: '#f28b82',
                },
                chromeyellow: {
                    DEFAULT: '#f9ab00',
                    pale: '#fdd663',
                },
                chromegreen: {
                    DEFAULT: '#188038',
                    pale: '#81c995',
                },
                chromepink: {
                    DEFAULT: '#d01884',
                    pale: '#ff8bcb',
                },
                chromepurple: {
                    DEFAULT: '#a142f4',
                    pale: '#c58af9',
                },
                chromecyan: {
                    DEFAULT: '#007b83',
                    pale: '#78d9ec',
                },
                chromeorange: {
                    DEFAULT: '#fa903e',
                    pale: '#fcad70',
                },
            },
            screens: {
                xl: '1024px',
                '2xl': '1024px',
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
    ],
    safelist: [
        {
            pattern: /(border|bg|ring|text)-chrome.+/,
            variants: ['dark', 'dark:focus', 'focus'],
        },
    ],
}
