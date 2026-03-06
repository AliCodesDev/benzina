'use client';

import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { BEIRUT_CENTER, FUEL_TYPES, MAPBOX_STYLE } from '@/lib/constants';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const BRANDS = [
  'total',
  'totalenergies',
  'medco',
  'ipt',
  'coral',
  'hypco',
  'uniterminals',
  'wardieh',
  'apoil',
] as const;

const STATUSES = ['active', 'closed', 'temporarily_closed'] as const;

interface StationForm {
  name_en: string;
  name_ar: string;
  brand: string;
  status: string;
  fuel_types: string[];
  address_en: string;
  address_ar: string;
  city: string;
  caza: string;
  phone: string;
  is_24h: boolean;
  amenities: string;
  lat: number;
  lng: number;
}

const EMPTY_FORM: StationForm = {
  name_en: '',
  name_ar: '',
  brand: '',
  status: 'active',
  fuel_types: [],
  address_en: '',
  address_ar: '',
  city: '',
  caza: '',
  phone: '',
  is_24h: false,
  amenities: '',
  lat: BEIRUT_CENTER.lat,
  lng: BEIRUT_CENTER.lng,
};

export default function AdminStationEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';

  const [form, setForm] = useState<StationForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Fetch station data for edit
  useEffect(() => {
    if (isNew) return;

    async function fetchStation() {
      try {
        const res = await fetch(`/api/stations/${id}`);
        if (!res.ok) {
          toast.error('Station not found');
          router.back();
          return;
        }
        const data = await res.json();
        const s = data.station;
        setForm({
          name_en: s.name_en ?? '',
          name_ar: s.name_ar ?? '',
          brand: s.brand ?? '',
          status: s.status ?? 'active',
          fuel_types: s.fuel_types ?? [],
          address_en: s.address_en ?? '',
          address_ar: s.address_ar ?? '',
          city: s.city ?? '',
          caza: s.caza ?? '',
          phone: s.phone ?? '',
          is_24h: s.is_24h ?? false,
          amenities: s.amenities?.join(', ') ?? '',
          lat: s.lat ?? BEIRUT_CENTER.lat,
          lng: s.lng ?? BEIRUT_CENTER.lng,
        });
      } catch {
        toast.error('Failed to load station');
      } finally {
        setLoading(false);
      }
    }

    fetchStation();
  }, [id, isNew, router]);

  const updateMarker = useCallback((lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    }
  }, []);

  // Initialize map after form is loaded
  useEffect(() => {
    if (loading || !mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLE,
      center: [form.lng, form.lat],
      zoom: 14,
    });

    const marker = new mapboxgl.Marker({ draggable: true })
      .setLngLat([form.lng, form.lat])
      .addTo(map);

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      setForm((prev) => ({
        ...prev,
        lat: Math.round(lngLat.lat * 1000000) / 1000000,
        lng: Math.round(lngLat.lng * 1000000) / 1000000,
      }));
    });

    map.on('click', (e) => {
      const { lat, lng } = e.lngLat;
      marker.setLngLat([lng, lat]);
      setForm((prev) => ({
        ...prev,
        lat: Math.round(lat * 1000000) / 1000000,
        lng: Math.round(lng * 1000000) / 1000000,
      }));
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      mapRef.current = null;
      markerRef.current = null;
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Update marker when lat/lng inputs change
  useEffect(() => {
    updateMarker(form.lat, form.lng);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [form.lng, form.lat], duration: 500 });
    }
  }, [form.lat, form.lng, updateMarker]);

  function setField<K extends keyof StationForm>(key: K, value: StationForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFuelType(ft: string) {
    setForm((prev) => ({
      ...prev,
      fuel_types: prev.fuel_types.includes(ft)
        ? prev.fuel_types.filter((f) => f !== ft)
        : [...prev.fuel_types, ft],
    }));
  }

  async function handleSave() {
    if (!form.name_en.trim()) {
      toast.error('Name (English) is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name_en: form.name_en,
        name_ar: form.name_ar || null,
        brand: form.brand || null,
        brand_slug: form.brand || null,
        status: form.status,
        fuel_types: form.fuel_types,
        address_en: form.address_en || null,
        address_ar: form.address_ar || null,
        city: form.city || null,
        caza: form.caza || null,
        phone: form.phone || null,
        is_24h: form.is_24h,
        amenities: form.amenities
          ? form.amenities.split(',').map((a) => a.trim()).filter(Boolean)
          : null,
        lat: form.lat,
        lng: form.lng,
      };

      const url = isNew ? '/api/admin/stations' : `/api/admin/stations/${id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to save station');
        return;
      }

      toast.success(isNew ? 'Station created' : 'Station updated');

      if (isNew) {
        const data = await res.json();
        router.replace(`stations/${data.station.id}`);
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/admin/stations/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete station');
        return;
      }

      toast.success('Station closed');
      router.push('.');
    } catch {
      toast.error('Network error');
    } finally {
      setDeleteOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading station...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('.')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? 'Add Station' : 'Edit Station'}
            </h1>
            {!isNew && (
              <p className="text-sm text-muted-foreground">{id}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name_en">Name (English)</Label>
            <Input
              id="name_en"
              value={form.name_en}
              onChange={(e) => setField('name_en', e.target.value)}
              placeholder="Station name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name_ar">Name (Arabic)</Label>
            <Input
              id="name_ar"
              value={form.name_ar}
              onChange={(e) => setField('name_ar', e.target.value)}
              placeholder="اسم المحطة"
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label>Brand</Label>
            <Select
              value={form.brand}
              onValueChange={(v) => setField('brand', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>
                    <span className="capitalize">{b}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setField('status', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="capitalize">{s.replace('_', ' ')}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Fuel Types */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Fuel Types</h2>
        <div className="flex flex-wrap gap-4">
          {FUEL_TYPES.map((ft) => (
            <label key={ft} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.fuel_types.includes(ft)}
                onCheckedChange={() => toggleFuelType(ft)}
              />
              <span className="text-sm uppercase">{ft}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {form.fuel_types.map((ft) => (
            <Badge key={ft} variant="outline">{ft}</Badge>
          ))}
        </div>
      </section>

      {/* Address */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Address</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="address_en">Address (English)</Label>
            <Input
              id="address_en"
              value={form.address_en}
              onChange={(e) => setField('address_en', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_ar">Address (Arabic)</Label>
            <Input
              id="address_ar"
              value={form.address_ar}
              onChange={(e) => setField('address_ar', e.target.value)}
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => setField('city', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caza">Caza</Label>
            <Input
              id="caza"
              value={form.caza}
              onChange={(e) => setField('caza', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Details</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={form.is_24h}
              onCheckedChange={(checked) =>
                setField('is_24h', checked === true)
              }
            />
            <span className="text-sm">Open 24 hours</span>
          </label>
          <div className="space-y-2">
            <Label htmlFor="amenities">Amenities (comma-separated)</Label>
            <Input
              id="amenities"
              value={form.amenities}
              onChange={(e) => setField('amenities', e.target.value)}
              placeholder="car_wash, air, atm, shop"
            />
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Location</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              type="number"
              step="any"
              value={form.lat}
              onChange={(e) =>
                setField('lat', parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Longitude</Label>
            <Input
              id="lng"
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) =>
                setField('lng', parseFloat(e.target.value) || 0)
              }
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Click on the map or drag the marker to update coordinates
        </p>
        <div
          ref={mapContainerRef}
          className="h-72 w-full rounded-lg border border-border"
        />
      </section>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete station?</DialogTitle>
            <DialogDescription>
              This will set the station status to &quot;closed&quot;. The record
              will not be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
