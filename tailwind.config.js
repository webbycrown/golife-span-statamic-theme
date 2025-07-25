/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: [
    './src/**/*.{html,js}'
    ],
  theme: {
     container: {
          center: true,
          padding: '1rem',
        },
        screens: {
          'sm': '640px',
          // => @media (min-width: 640px) { ... }
          'md': '768px',
          // => @media (min-width: 768px) { ... }
          'lg': '992px',
          // => @media (min-width: 1199px) { ... }
          'xl': '1170px',
          // => @media (min-width: 1440px) { ... }
          '1xl': '1220px',
          // => @media (min-width: 1440px) { ... }
          '2xl': '1340px',
          // => @media (min-width: 1440px) { ... }

        },
        colors: {
            'black': '#000000',
            'white': '#ffffff',
            'transparent': 'transparent',
            'blue':'#214388',
            'green':'#1A824A',

            primary: {
                '400':"#F0F4F3",
                '800': '#F8D419',
                '900': '#083D31',
              },
            gray: {
                '100': '#F2F2F2',
                '200': '#EBEBEB',
                '300': '#F8F8F8',
                '500': '#FBFBFB',
                '400': '#414142',
                '800': '#02130F',
              },
        },
        extend: {
            fontFamily: {
                'satoshi': ['Satoshi', 'sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
            },
            
            fontSize: {
                'md': '16px',
                'lg': '18px',
                'xl': '20px',
                '1xl': '22px',
                '2xl': '24px',
                '3xl': '26px',
                '4xl': '30px',
                '5xl': '35px',
                '6xl': '45px',
                '7xl': '55px',
            },

            spacing: {
                'full': '100%',
                
            },
            boxShadow: {
                'card': '0px 4px 9px rgba(0, 0, 0, 0.12)',
                'box' : '0px 4px 4px rgba(0, 0, 0, 0.25)',
                'input': '0px 2px 8px 0px rgba(25, 13, 31, 0.12)',
            },
            borderRadius: {
              '7xl': '50px',
              '6xl': '40px',
              '5xl': '30px',
              '4xl': '20px',
              '2xl': '15px',
              '1xl': '12px',
              'xl': '10px',
            },
            margin: {
                'auto': 'auto',
            },
            zIndex: {
                '-1': '-1',
                '1': '1',
                '2': '2',
                '3': '3',
                '4': '4',
                '5': '5',
                '6': '6',
                '7': '7',
                '8': '8',
                '9': '9',
            },
            height: {
                '100vw': '100vw',
            },
            content:{

            },
            transitionDuration: {
             '0': '0ms',
             '3000': '3000ms',
            }
        },
  },
  plugins: [
    require('@tailwindcss/typography'),
    ],
}

