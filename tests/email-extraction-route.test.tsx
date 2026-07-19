import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import EmailExtractionRoute from '@/app/add/email';

const mockReplace = jest.fn();
const mockCreateParser = jest.fn();
const mockCreateItem = jest.fn();
let mockMode: 'demo' | 'connected' = 'demo';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useIsFocused: () => true,
  usePathname: () => '/add/email',
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
}));

jest.mock('@/features/financial-items/hooks/use-financial-items', () => ({
  useFinancialItems: () => ({
    createItem: mockCreateItem,
    dismissMutationError: jest.fn(),
    mode: mockMode,
    mutationErrors: [],
  }),
}));

jest.mock('@/services/email-parser/service', () => ({
  createDefaultFinancialEmailParser: () => mockCreateParser(),
}));

describe('Checkpoint 5B-2 email route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMode = 'demo';
  });

  it('keeps direct Local demo access static and never creates a parser service', () => {
    render(<EmailExtractionRoute />);

    expect(
      screen.getByText(
        'Email extraction requires Connected mode. You can still add a task manually.',
      ),
    ).toBeTruthy();
    expect(mockCreateParser).not.toHaveBeenCalled();
    fireEvent.press(
      screen.getByRole('button', { name: 'Choose a manual task' }),
    );
    expect(mockReplace).toHaveBeenCalledWith('/add');
  });

  it('uses only fixed route destinations and sends no raw email to provider state', async () => {
    mockMode = 'connected';
    mockCreateParser.mockReturnValue({
      extract: jest.fn().mockResolvedValue({
        isActionable: true,
        candidate: {
          merchantName: 'Example',
          title: 'Review renewal',
          kind: 'subscription',
          valueCents: null,
          chargeAmountCents: 1200,
          deadlineDate: '2026-08-15',
          recurrence: 'monthly',
          actionUrl: null,
        },
        confidence: 0.8,
        warnings: [],
      }),
    });
    mockCreateItem.mockResolvedValue({ id: 'created' });
    render(<EmailExtractionRoute />);

    const email = 'Private renewal message for $12 on 2026-08-15.';
    fireEvent.changeText(screen.getByLabelText(/Email text, required/), email);
    fireEvent.press(screen.getByRole('button', { name: 'Extract task' }));
    await screen.findByText('Review extracted task');
    fireEvent.press(screen.getByRole('button', { name: 'Save task' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));

    expect(JSON.stringify(mockCreateItem.mock.calls)).not.toContain(email);
    expect(JSON.stringify(mockReplace.mock.calls)).not.toContain(email);
  });
});
