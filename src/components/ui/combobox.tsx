import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type ComboboxOption = {
  value: string;
  label: string;
  // Muted text shown next to the label (e.g. a mobile number / salesman name).
  hint?: string;
  // Extra text included in the search match but not displayed.
  keywords?: string;
};

function matches(opt: ComboboxOption, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    opt.label.toLowerCase().includes(needle) ||
    (opt.hint ?? '').toLowerCase().includes(needle) ||
    (opt.keywords ?? '').toLowerCase().includes(needle)
  );
}

function OptionRow({
  opt,
  selected,
  onSelect,
}: {
  opt: ComboboxOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      role="option"
      aria-selected={selected}
      className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
      onClick={onSelect}
    >
      <Check className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', selected ? 'opacity-100' : 'opacity-0')} />
      <div className="min-w-0 flex-1">
        <div className="break-words">{opt.label}</div>
        {opt.hint ? (
          <div className="break-words text-xs text-muted-foreground">{opt.hint}</div>
        ) : null}
      </div>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b px-2 pb-2">
      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <Input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search...'}
        className="h-7 border-0 px-0 text-sm shadow-none focus-visible:ring-0"
      />
    </div>
  );
}

export type ComboboxProps = {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  triggerClassName?: string;
};

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select',
  searchPlaceholder,
  emptyText = 'No results',
  disabled,
  triggerClassName,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const filtered = useMemo(() => options.filter((o) => matches(o, query)), [options, query]);

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('h-8 w-full justify-between text-sm font-normal', triggerClassName)}
        >
          <span className={cn('truncate', selected ? '' : 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="flex max-h-[min(20rem,var(--radix-popover-content-available-height))] w-[--radix-popover-trigger-width] flex-col p-2"
        align="start"
        collisionPadding={8}
      >
        <SearchBox value={query} onChange={setQuery} placeholder={searchPlaceholder} />
        <div className="mt-1 min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">{emptyText}</p>
          ) : (
            filtered.map((opt, idx) => (
              <OptionRow
                key={`${opt.value}-${idx}`}
                opt={opt}
                selected={opt.value === value}
                onSelect={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setQuery('');
                }}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type MultiComboboxProps = {
  options: ComboboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  triggerClassName?: string;
};

export function MultiCombobox({
  options,
  values,
  onChange,
  placeholder = 'Select',
  searchPlaceholder,
  emptyText = 'No results',
  disabled,
  triggerClassName,
}: MultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => options.filter((o) => matches(o, query)), [options, query]);
  const label = useMemo(() => {
    if (values.length === 0) return placeholder;
    if (values.length === 1) {
      return options.find((o) => o.value === values[0])?.label ?? '1 selected';
    }
    return `${values.length} selected`;
  }, [values, options, placeholder]);

  function toggle(value: string) {
    onChange(
      values.includes(value) ? values.filter((v) => v !== value) : [...values, value],
    );
  }

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('h-8 w-full justify-between text-sm font-normal', triggerClassName)}
        >
          <span className={cn('truncate', values.length === 0 ? 'text-muted-foreground' : '')}>
            {label}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
        <SearchBox value={query} onChange={setQuery} placeholder={searchPlaceholder} />
        <div className="mt-1 max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">{emptyText}</p>
          ) : (
            filtered.map((opt, idx) => (
              <OptionRow
                key={`${opt.value}-${idx}`}
                opt={opt}
                selected={values.includes(opt.value)}
                onSelect={() => toggle(opt.value)}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
