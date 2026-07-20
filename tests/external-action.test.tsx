import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import {
  ExternalAction,
  openExternalActionPage,
} from '@/features/financial-items/components/external-action';

describe('Checkpoint 6B external action safety', () => {
  it('displays only the HTTPS hostname and blocks rapid duplicate opens', async () => {
    let resolveOpen: () => void = () => undefined;
    const openUrl = jest.spyOn(Linking, 'openURL').mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveOpen = resolve;
        }),
    );
    const actionUrl = 'https://founderscard.com/account?token=private-value';
    const view = render(
      <ExternalAction actionUrl={actionUrl} provider="FoundersCard" />,
    );

    expect(screen.getByText('Open FoundersCard')).toBeTruthy();
    expect(
      screen.getByText('founderscard.com · External website'),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Opens externally. Clawback does not take the action for you.',
      ),
    ).toBeTruthy();
    expect(JSON.stringify(view.toJSON())).not.toContain('private-value');

    const opener = screen.getByRole('link', {
      name: 'Open FoundersCard on founderscard.com',
    });
    fireEvent.press(opener);
    fireEvent.press(opener);
    expect(openUrl).toHaveBeenCalledTimes(1);
    expect(openUrl).toHaveBeenCalledWith(actionUrl);

    await act(async () => {
      resolveOpen();
      await Promise.resolve();
    });
    openUrl.mockRestore();
  });

  it.each([
    null,
    'http://example.com/account',
    'https://user:password@example.com/account',
    'not a URL',
    'javascript:alert(1)',
  ] as Array<string | null>)(
    'renders no opener for rejected URL %s',
    (actionUrl) => {
      const openUrl = jest.spyOn(Linking, 'openURL');
      const view = render(<ExternalAction actionUrl={actionUrl} />);

      const unavailable = screen.getByLabelText('No action link saved');
      expect(screen.getByText('No action link saved')).toBeTruthy();
      expect(
        screen.getByText('Open the provider’s app or website manually.'),
      ).toBeTruthy();
      expect(unavailable.props.onPress).toBeUndefined();
      expect(unavailable.props.accessibilityRole).toBeUndefined();
      expect(unavailable.props.className).not.toMatch(/rounded|border|bg-/);
      expect(screen.queryByRole('link')).toBeNull();
      expect(screen.queryByRole('button')).toBeNull();
      if (actionUrl) {
        expect(JSON.stringify(view.toJSON())).not.toContain(actionUrl);
      }
      expect(openUrl).not.toHaveBeenCalled();
      openUrl.mockRestore();
    },
  );

  it('revalidates before opening and never calls the opener for unsafe input', async () => {
    const openUrl = jest.fn().mockResolvedValue(undefined);

    await expect(
      openExternalActionPage('http://example.com/private', openUrl),
    ).resolves.toBe('invalid');
    await expect(
      openExternalActionPage('https://example.com/account?safe=1', openUrl),
    ).resolves.toBe('opened');

    expect(openUrl).toHaveBeenCalledTimes(1);
    expect(openUrl).toHaveBeenCalledWith('https://example.com/account?safe=1');
  });

  it('shows a safe explicit Retry and lets Dismiss clear only the error', async () => {
    const rawError = new Error('platform secret payload');
    let resolveRetry: () => void = () => undefined;
    const openUrl = jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValueOnce(rawError)
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveRetry = resolve;
          }),
      );
    const consoleLog = jest.spyOn(console, 'log').mockImplementation();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const view = render(
      <ExternalAction actionUrl="https://example.com/account?jwt=private" />,
    );

    await act(async () => {
      fireEvent.press(
        screen.getByRole('link', {
          name: 'Open action page on example.com',
        }),
      );
      await Promise.resolve();
    });
    expect(
      screen.getByText(
        'We could not open this external action page. Try again when you are ready.',
      ),
    ).toBeTruthy();
    expect(JSON.stringify(view.toJSON())).not.toContain('platform secret');
    expect(JSON.stringify(view.toJSON())).not.toContain('jwt=private');
    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();

    const retry = screen.getByRole('link', {
      name: 'Retry opening action page on example.com',
    });
    fireEvent.press(retry);
    fireEvent.press(retry);
    expect(openUrl).toHaveBeenCalledTimes(2);
    await act(async () => {
      resolveRetry();
      await Promise.resolve();
    });
    expect(screen.queryByText(/We could not open/)).toBeNull();

    openUrl.mockRejectedValueOnce(rawError);
    await act(async () => {
      fireEvent.press(
        screen.getByRole('link', {
          name: 'Open action page on example.com',
        }),
      );
      await Promise.resolve();
    });
    fireEvent.press(
      screen.getByRole('button', { name: 'Dismiss action page error' }),
    );
    expect(screen.queryByText(/We could not open/)).toBeNull();
    expect(
      screen.getByRole('link', {
        name: 'Open action page on example.com',
      }),
    ).toBeTruthy();

    consoleLog.mockRestore();
    consoleError.mockRestore();
    openUrl.mockRestore();
  });

  it('releases component-local open state on unmount', async () => {
    let resolveFirstOpen: () => void = () => undefined;
    const openUrl = jest.spyOn(Linking, 'openURL').mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstOpen = resolve;
        }),
    );
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const firstView = render(
      <ExternalAction actionUrl="https://example.com/account" />,
    );

    fireEvent.press(
      screen.getByRole('link', { name: 'Open action page on example.com' }),
    );
    firstView.unmount();
    await act(async () => {
      resolveFirstOpen();
      await Promise.resolve();
    });
    expect(consoleError).not.toHaveBeenCalled();

    openUrl.mockResolvedValueOnce(undefined);
    render(<ExternalAction actionUrl="https://example.com/account" />);
    await act(async () => {
      fireEvent.press(
        screen.getByRole('link', { name: 'Open action page on example.com' }),
      );
      await Promise.resolve();
    });
    expect(openUrl).toHaveBeenCalledTimes(2);

    consoleError.mockRestore();
    openUrl.mockRestore();
  });
});
