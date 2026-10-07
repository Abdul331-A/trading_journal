import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/Misc';
import { PnlCalendar } from '@/components/calendar/PnlCalendar';
import { useTradeModal } from '@/components/trades/TradeModalContext';

export default function CalendarPage() {
  const { open } = useTradeModal();
  return (
    <>
      <PageHeader title="Calendar" subtitle="Daily profit and loss, with weekly totals." actions={<Button onClick={() => open()} className="hidden md:inline-flex"><Plus className="h-4 w-4" /> Log trade</Button>} />
      <PnlCalendar />
    </>
  );
}
