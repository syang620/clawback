import { act, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  FinancialItemsProvider,
  type FinancialItemsProviderDependencies,
  useFinancialItems,
} from '@/features/financial-items/hooks/use-financial-items';
import type { FinancialItemsRepository } from '@/services/financial-items/repository';
import type { FinancialItem } from '@/types/financial-item';

const connectedEnvironment = {
  mode: 'connected',
  publishableKey: 'public-test-key',
  url: 'https://project.supabase.co',
} as const;

function repositoryWith(items: FinancialItem[]): FinancialItemsRepository {
  return {
    listItems: jest.fn().mockResolvedValue(items),
    getItem: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    completeItem: jest.fn(),
    restoreItem: jest.fn(),
    deleteItem: jest.fn(),
    ensureInitialSeed: jest.fn().mockResolvedValue(undefined),
  };
}

function Harness({
  capture,
}: {
  capture: (context: ReturnType<typeof useFinancialItems>) => void;
}) {
  const context = useFinancialItems();
  capture(context);
  return (
    <>
      <Text>{`Phase ${context.initialization.phase}`}</Text>
      <Text>{`Mode ${context.mode ?? 'none'}`}</Text>
      <Text>{`Titles ${context.items.map((item) => item.title).join(',')}`}</Text>
    </>
  );
}

describe('Checkpoint 4B initialization', () => {
  it('surfaces partial configuration without selecting demo mode', async () => {
    let context: ReturnType<typeof useFinancialItems> | null = null;
    const dependencies: FinancialItemsProviderDependencies = {
      environment: {
        mode: 'error',
        message: 'Supabase configuration is incomplete.',
      },
      createLocalRepository: jest.fn(),
      createConnectedRuntime: jest.fn(),
    };
    render(
      <FinancialItemsProvider dependencies={dependencies}>
        <Harness capture={(value) => (context = value)} />
      </FinancialItemsProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText('Phase configuration-error')).toBeTruthy(),
    );
    expect(screen.getByText('Mode none')).toBeTruthy();
    expect(dependencies.createLocalRepository).not.toHaveBeenCalled();
    expect(context).not.toBeNull();
  });

  it('ignores a stale initialization result after a newer Retry succeeds', async () => {
    let context: ReturnType<typeof useFinancialItems> | null = null;
    let resolveFirst:
      | ((value: {
          release: () => void;
          repository: FinancialItemsRepository;
        }) => void)
      | null = null;
    const staleRelease = jest.fn();
    const currentRelease = jest.fn();
    const staleRepository = repositoryWith([
      { id: 'stale', title: 'Stale task' } as FinancialItem,
    ]);
    const currentRepository = repositoryWith([
      { id: 'current', title: 'Current task' } as FinancialItem,
    ]);
    const firstRuntime = new Promise<{
      release: () => void;
      repository: FinancialItemsRepository;
    }>((resolve) => {
      resolveFirst = resolve;
    });
    const createConnectedRuntime = jest
      .fn()
      .mockReturnValueOnce(firstRuntime)
      .mockResolvedValueOnce({
        release: currentRelease,
        repository: currentRepository,
      });
    const dependencies: FinancialItemsProviderDependencies = {
      environment: connectedEnvironment,
      createLocalRepository: jest.fn(),
      createConnectedRuntime,
    };

    const view = render(
      <FinancialItemsProvider dependencies={dependencies}>
        <Harness capture={(value) => (context = value)} />
      </FinancialItemsProvider>,
    );
    await waitFor(() =>
      expect(createConnectedRuntime).toHaveBeenCalledTimes(1),
    );

    act(() => {
      if (!context) throw new Error('Context was not captured.');
      context.retryInitialization();
    });
    await waitFor(() => expect(screen.getByText('Phase ready')).toBeTruthy());
    expect(screen.getByText('Titles Current task')).toBeTruthy();

    await act(async () => {
      resolveFirst?.({ release: staleRelease, repository: staleRepository });
      await firstRuntime;
    });
    expect(screen.getByText('Titles Current task')).toBeTruthy();
    expect(staleRelease).toHaveBeenCalledTimes(1);
    expect(staleRepository.ensureInitialSeed).not.toHaveBeenCalled();

    view.unmount();
    expect(currentRelease).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['seed-error', 'ensureInitialSeed'],
    ['read-error', 'listItems'],
  ] as const)(
    'reports a safe %s without falling back',
    async (phase, method) => {
      const repository = repositoryWith([]);
      (repository[method] as jest.Mock).mockRejectedValue(
        new Error('private backend details'),
      );
      const dependencies: FinancialItemsProviderDependencies = {
        environment: connectedEnvironment,
        createLocalRepository: jest.fn(),
        createConnectedRuntime: jest.fn().mockResolvedValue({ repository }),
      };

      render(
        <FinancialItemsProvider dependencies={dependencies}>
          <Harness capture={() => undefined} />
        </FinancialItemsProvider>,
      );

      await waitFor(() =>
        expect(screen.getByText(`Phase ${phase}`)).toBeTruthy(),
      );
      expect(screen.getByText('Mode none')).toBeTruthy();
      expect(dependencies.createLocalRepository).not.toHaveBeenCalled();
    },
  );

  it('reports a safe authentication failure without selecting demo mode', async () => {
    const dependencies: FinancialItemsProviderDependencies = {
      environment: connectedEnvironment,
      createLocalRepository: jest.fn(),
      createConnectedRuntime: jest
        .fn()
        .mockRejectedValue(new Error('private auth details')),
    };

    render(
      <FinancialItemsProvider dependencies={dependencies}>
        <Harness capture={() => undefined} />
      </FinancialItemsProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText('Phase auth-error')).toBeTruthy(),
    );
    expect(screen.getByText('Mode none')).toBeTruthy();
    expect(dependencies.createLocalRepository).not.toHaveBeenCalled();
  });
});
