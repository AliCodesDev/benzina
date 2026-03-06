import { NextRequest, NextResponse } from 'next/server';

import { verifyAdminSession } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { lat, lng, ...fields } = body;

    // If lat/lng provided, convert to PostGIS point
    const updateData: Record<string, unknown> = { ...fields };
    if (lat != null && lng != null) {
      updateData.location = `POINT(${lng} ${lat})`;
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;

    const supabase = createAdminClient();

    const { data: station, error } = await supabase
      .from('stations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    if (!station) {
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ station });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('stations')
      .update({ status: 'closed' })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
