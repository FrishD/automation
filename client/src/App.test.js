import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';

jest.mock('axios');

test('renders the sidebar with blocks', async () => {
  axios.get.mockResolvedValue({ data: [] });
  axios.post.mockResolvedValue({ data: { nodes: [], edges: [] } });
  render(<App />);
  await waitFor(() => {
    const sidebarTitle = screen.getByText(/Palette/i);
    expect(sidebarTitle).toBeInTheDocument();
  });
});
