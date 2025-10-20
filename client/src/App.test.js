import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the sidebar with blocks', () => {
  render(<App />);
  const sidebarTitle = screen.getByText(/Blocks/i);
  expect(sidebarTitle).toBeInTheDocument();
});
