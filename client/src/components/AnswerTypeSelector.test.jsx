import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnswerTypeSelector from './AnswerTypeSelector';

function Controlled({ onValue, disabled }) {
  const [value, setValue] = useState('single');
  return (
    <AnswerTypeSelector
      value={value}
      disabled={disabled}
      onChange={(next) => {
        setValue(next);
        onValue(next);
      }}
    />
  );
}

describe('AnswerTypeSelector', () => {
  test('is a labeled radio group with the full copy and Single choice selected', () => {
    render(<Controlled onValue={jest.fn()} />);

    expect(screen.getByRole('group', { name: 'Answer type' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Single choice — people pick one answer' })).toBeChecked();
    expect(
      screen.getByRole('radio', { name: 'Multiple choice — people can pick more than one answer' }),
    ).not.toBeChecked();
  });

  test('selecting Multiple choice reports it and moves the check icon', async () => {
    const onValue = jest.fn();
    render(<Controlled onValue={onValue} />);

    await userEvent.click(screen.getByText('Multiple choice — people can pick more than one answer'));

    expect(onValue).toHaveBeenCalledWith('multiple');
    expect(screen.getByRole('radio', { name: /Multiple choice/ })).toBeChecked();
    expect(screen.getByTestId('answer-type-indicator-multiple').querySelector('svg')).not.toBeNull();
    expect(screen.getByTestId('answer-type-indicator-single').querySelector('svg')).toBeNull();
  });

  test('arrow keys change the selection', async () => {
    const onValue = jest.fn();
    render(<Controlled onValue={onValue} />);

    screen.getByRole('radio', { name: /Single choice/ }).focus();
    await userEvent.keyboard('{ArrowDown}');

    expect(onValue).toHaveBeenCalledWith('multiple');
  });

  test('is locked while saving', () => {
    render(<Controlled onValue={jest.fn()} disabled />);

    screen.getAllByRole('radio').forEach((radio) => expect(radio).toBeDisabled());
  });
});
