import { createDemoItems } from '@/constants/demo-data';
import { Dashboard } from '@/features/financial-items/components/dashboard';

export default function DashboardRoute() {
  return <Dashboard items={createDemoItems(new Date())} />;
}
