'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StationRow {
  id: string;
  name_en: string;
  brand: string | null;
  status: string;
  fuel_types: string[];
  is_verified: boolean;
}

const PAGE_SIZE = 20;

export default function AdminStationsPage() {
  const router = useRouter();
  const [stations, setStations] = useState<StationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchStations = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(PAGE_SIZE),
      });
      if (q) params.set('q', q);

      const res = await fetch(`/api/admin/stations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStations(data.stations);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch stations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations(page, search);
  }, [page, search, fetchStations]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const statusVariant = (status: string) => {
    if (status === 'active') return 'default' as const;
    if (status === 'closed') return 'destructive' as const;
    return 'secondary' as const;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stations</h1>
          <p className="text-sm text-muted-foreground">
            {total} total stations
          </p>
        </div>
        <Button onClick={() => router.push('stations/new')}>
          <Plus className="h-4 w-4" />
          Add Station
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search stations..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fuel Types</TableHead>
              <TableHead>Verified</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : stations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No stations found
                </TableCell>
              </TableRow>
            ) : (
              stations.map((station) => (
                <TableRow
                  key={station.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`stations/${station.id}`)}
                >
                  <TableCell className="font-medium">
                    {station.name_en}
                  </TableCell>
                  <TableCell className="capitalize">
                    {station.brand || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(station.status)}>
                      {station.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {station.fuel_types.map((ft) => (
                        <Badge key={ft} variant="outline" className="text-xs">
                          {ft}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {station.is_verified ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
