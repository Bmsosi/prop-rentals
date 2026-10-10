// tailwind.config.js
module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
    theme: {
        extend: {
            colors: {
                primary: '#1D3742',
                background: '#F8F7EE',
                card: '#FEFFF8',
                chart: {
                    1: '#E57667',
                    2: '#FFBA53',
                    3: '#53848F',
                },
            },
        },
    },
    plugins: [],
};
