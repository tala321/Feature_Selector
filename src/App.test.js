import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome message', () => {
  render(<App />);
  const welcomeText = screen.getByText(/Welcome to CSV file Uploader/i);
  expect(welcomeText).toBeInTheDocument();
});

test('renders drop zone instruction', () => {
  render(<App />);
  const dropZoneText = screen.getByText(/Drag & Drop CSV Here or Click to Browse/i);
  expect(dropZoneText).toBeInTheDocument();
});