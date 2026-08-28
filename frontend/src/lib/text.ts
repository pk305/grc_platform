export const cleanText = str =>
  (str.charAt(0).toUpperCase() + str.slice(1))
    .replace(/-/g, ' ')
    .replace('_and_', '&');

export const getFirstLetter = str => (str.match(/\b\w/g) || []).join('');
