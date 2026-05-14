import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        '../backend/vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        '../backend/storage/framework/views/*.php',
        '../backend/resources/views/**/*.blade.php',
        './src/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            keyframes: {
                slideIn: {
                    '0%':   { opacity: '0', transform: 'translateX(100%) scale(0.95)' },
                    '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
                },
                fadeIn: {
                    '0%':   { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                scaleIn: {
                    '0%':   { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                shimmer: {
                    '0%':   { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            animation: {
                slideIn:  'slideIn 0.2s ease',
                fadeIn:   'fadeIn 0.2s ease',
                scaleIn:  'scaleIn 0.15s ease',
                shimmer:  'shimmer 1.5s infinite linear',
            },
        },
    },

    plugins: [forms],
};
