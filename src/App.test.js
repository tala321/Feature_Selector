import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  render(<App />);
});

test('renders learn react link', () => {
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

test('renders welcome message', () => {
  const welcomeText = screen.getByText(/Welcome to CSV file Uploader/i);
  expect(welcomeText).toBeInTheDocument();
});

test('renders drop zone instruction', () => {
  const dropZoneText = screen.getByText(/Drag & Drop CSV Here or Click to Browse/i);
  expect(dropZoneText).toBeInTheDocument();
});