import * as React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('renders its label and responds to press', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button label="Sign in" onPress={onPress} />);

    const button = getByRole('button', { name: 'Sign in' });
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button label="Submit" onPress={onPress} disabled />);

    const button = getByRole('button', { name: 'Submit' });
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a loading indicator instead of the label while loading', () => {
    const { queryByText } = render(<Button label="Submit" onPress={jest.fn()} loading />);

    expect(queryByText('Submit')).toBeNull();
  });

  it('marks itself disabled to accessibility tooling while loading', () => {
    const { getByRole } = render(<Button label="Submit" onPress={jest.fn()} loading />);

    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });
});
