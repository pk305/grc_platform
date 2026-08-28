export const colors = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'danger',
  'light',
  'dark'
];

export const grays = [
  'black',
  1100,
  1000,
  900,
  800,
  700,
  600,
  500,
  400,
  300,
  200,
  100,
  'soft',
  'white'
];

export const colorsAll = [...colors, ...grays];

export const themeColor = {
  primary: '#3874ff',
  secondary: '#49525d',
  success: '#25b003',
  info: '#0097eb',
  warning: '#e5780b',
  danger: '#ec1f00',
  light: '#f6f7f8',
  dark: '#15181b'
};

export const graysColor = {
  white: '#fff',
  soft: '#fcfcfd',
  100: '#f6f7f8',
  200: '#f1f2f4',
  300: '#e2e5e9',
  400: '#b1b9c2',
  500: '#9aa3af',
  600: '#84909e',
  700: '#6d7a8a',
  800: '#5a6573',
  900: '#49525d',
  1000: '#2b3036',
  1100: '#15181b',
  black: '#000'
};

export const capitalize = value =>
  typeof value === 'string'
    ? `${value.charAt(0).toUpperCase()}${value.slice(1)}`
    : value;
