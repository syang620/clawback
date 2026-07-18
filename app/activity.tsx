import { Activity } from '@/features/financial-items/components/activity';
import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';

export default function ActivityRoute() {
  const { items } = useFinancialItems();
  return <Activity items={items} />;
}
