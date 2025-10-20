import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the conversation flow builder title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Conversation Flow Builder/i);
  expect(titleElement).toBeInTheDocument();
});
