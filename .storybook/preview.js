/** @type { import('@storybook/react-vite').Preview } */
import '../dist/styles/tailwind.css'; // Import global styles

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
