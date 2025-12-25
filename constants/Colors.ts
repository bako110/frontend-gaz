/**
 * Below is the color palette used in the app (light and dark mode)
 * The colors are defined in the light and dark objects below.
 * There are many other ways to style your app in React Native, using
 * `StyleSheet.create` is often thought to be one of the best ways to do it.
 */

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
