"use client";

import { CalendarDate, parseDate } from "@internationalized/date";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Button,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DateRangePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  RangeCalendar,
  Select,
  SelectValue,
} from "react-aria-components";
import { WINDOW_OPTIONS, type Range } from "@/lib/range";

type DateRange = { start: CalendarDate; end: CalendarDate } | null;

export function Controls({ range }: { range: Range }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(next: Partial<Range>) {
    const merged = { ...range, ...next };
    const sp = new URLSearchParams(params.toString());
    sp.set("from", merged.from);
    sp.set("to", merged.to);
    sp.set("window", String(merged.window));
    startTransition(() => router.push(`/?${sp.toString()}`));
  }

  return (
    <div className="controls" data-pending={pending || undefined}>
      <DateRangePicker
        value={{ start: parseDate(range.from), end: parseDate(range.to) }}
        onChange={(value: DateRange) => {
          if (!value) return;
          update({ from: value.start.toString(), to: value.end.toString() });
        }}
      >
        <Label>Date range</Label>
        <Group className="rac-group">
          <DateInput slot="start">
            {(segment) => <DateSegment segment={segment} />}
          </DateInput>
          <span aria-hidden="true" className="range-dash">
            –
          </span>
          <DateInput slot="end">
            {(segment) => <DateSegment segment={segment} />}
          </DateInput>
          <Button className="rac-trigger">▼</Button>
        </Group>
        <Popover className="rac-popover">
          <Dialog>
            <RangeCalendar>
              <header className="cal-header">
                <Button slot="previous">◀</Button>
                <Heading />
                <Button slot="next">▶</Button>
              </header>
              <CalendarGrid>
                {(date) => <CalendarCell date={date} />}
              </CalendarGrid>
            </RangeCalendar>
          </Dialog>
        </Popover>
      </DateRangePicker>

      <Select
        selectedKey={String(range.window)}
        onSelectionChange={(key) => update({ window: Number(key) })}
      >
        <Label>Follow-through window</Label>
        <Button className="rac-select-trigger">
          <SelectValue />
          <span aria-hidden="true">▼</span>
        </Button>
        <Popover className="rac-popover">
          <ListBox>
            {WINDOW_OPTIONS.map((w) => (
              <ListBoxItem key={w} id={String(w)}>
                {w} min
              </ListBoxItem>
            ))}
          </ListBox>
        </Popover>
      </Select>
    </div>
  );
}
