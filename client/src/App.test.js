import { render, screen } from '@testing-library/react';
import App from './App';
import axios from 'axios';

// Mock the 'use-undo' library to handle its default export correctly in the Jest environment.
// This prevents the 'undefined is not iterable' error during testing.
jest.mock('use-undo', () => ({
  __esModule: true,
  default: jest.fn(initialState => [
    { present: initialState },
    {
      set: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
      canUndo: false,
      canRedo: false,
    },
  ]),
}));

jest.mock('axios');

test('renders the sidebar with blocks', async () => {
  axios.get.mockResolvedValue({ data: [] });
  axios.post.mockResolvedValue({ data: { nodes: [], edges: [] } });

  render(<App />);

  // Verify that the main sidebar title "Palette" is present in the document.
  const sidebarTitle = await screen.findByText(/Palette/i);
  expect(sidebarTitle).toBeInTheDocument();
});
