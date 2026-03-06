'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const FUEL_TYPES = ['95', '98', 'diesel', 'lpg'] as const;

const FUEL_LABELS: Record<string, string> = {
  '95': 'Gasoline 95',
  '98': 'Gasoline 98',
  diesel: 'Diesel',
  lpg: 'LPG',
};

interface PriceRow {
  id: string;
  fuel_type: string;
  price_lbp: number;
  effective_date: string;
}

function todayString() {
  return new Date().toISOString().split('T')[0];
}

export default function AdminPricesPage() {
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(todayString);
  const [values, setValues] = useState<Record<string, string>>({
    '95': '',
    '98': '',
    diesel: '',
    lpg: '',
  });

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/prices');
      if (res.ok) {
        const data = await res.json();
        setPrices(data.prices);
      }
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const entries = FUEL_TYPES.filter((ft) => values[ft].trim() !== '').map(
      (ft) => ({
        fuel_type: ft,
        price_lbp: Number(values[ft]),
        price_unit: 'LBP/L',
        effective_date: date,
      }),
    );

    if (entries.length === 0) {
      toast.error('Enter at least one price');
      return;
    }

    for (const entry of entries) {
      if (isNaN(entry.price_lbp) || entry.price_lbp <= 0) {
        toast.error(`Invalid price for ${FUEL_LABELS[entry.fuel_type]}`);
        return;
      }
    }

    setSaving(true);
    try {
      const results = await Promise.all(
        entries.map((entry) =>
          fetch('/api/admin/prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
          }),
        ),
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        toast.error(`${failed.length} price(s) failed to save`);
      } else {
        toast.success(`${entries.length} price(s) updated`);
        setValues({ '95': '', '98': '', diesel: '', lpg: '' });
        fetchPrices();
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  }

  // Group prices by date for the history table
  const dateMap = new Map<string, Record<string, number>>();
  for (const p of prices) {
    if (!dateMap.has(p.effective_date)) {
      dateMap.set(p.effective_date, {});
    }
    dateMap.get(p.effective_date)![p.fuel_type] = p.price_lbp;
  }
  const dateRows = Array.from(dateMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 20);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold">Fuel Prices</h1>
        <p className="text-sm text-muted-foreground">
          Add or update daily fuel prices
        </p>
      </div>

      {/* Add Prices Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="date">Effective Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-48"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FUEL_TYPES.map((ft) => (
            <div key={ft} className="space-y-2">
              <Label htmlFor={`price-${ft}`}>{FUEL_LABELS[ft]} (LBP)</Label>
              <Input
                id={`price-${ft}`}
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 1450000"
                value={values[ft]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [ft]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Update Prices'}
        </Button>
      </form>

      {/* Price History */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Price History</h2>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">95</TableHead>
                <TableHead className="text-right">98</TableHead>
                <TableHead className="text-right">Diesel</TableHead>
                <TableHead className="text-right">LPG</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : dateRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No price data yet
                  </TableCell>
                </TableRow>
              ) : (
                dateRows.map(([dateStr, vals]) => (
                  <TableRow key={dateStr}>
                    <TableCell className="font-medium">{dateStr}</TableCell>
                    {FUEL_TYPES.map((ft) => (
                      <TableCell key={ft} className="text-right tabular-nums">
                        {vals[ft] != null
                          ? vals[ft].toLocaleString()
                          : '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
