/**
 * Mini Supabase REST client — fetch() direct, no SDK dependency.
 */

function getEnv(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return { url, key };
}

function restHeaders(key: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

type Row = Record<string, unknown>;
type QueryResult = { data: Row[] | null; error: Error | null };
type SingleResult = { data: Row | null; error: Error | null };
type Mode = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

function makeBuilder(baseUrl: string, key: string, table: string) {
  let _select = '*';
  const _filters: string[] = [];
  let _mode: Mode = 'select';
  let _mutateData: Row | Row[] | null = null;
  let _upsertOpts: Record<string, string> = {};
  let _limitN: number | null = null;

  const hdrs = restHeaders(key);
  const tableUrl = baseUrl + '/rest/v1/' + table;

  function buildFilterQS(): string {
    return _filters.join('&');
  }

  async function run(): Promise<QueryResult> {
    try {
      if (_mode === 'insert') {
        const r = await fetch(tableUrl, {
          method: 'POST',
          headers: Object.assign({}, hdrs, { Prefer: 'return=minimal' }),
          body: JSON.stringify(_mutateData),
        });
        if (!r.ok) return { data: null, error: new Error(await r.text()) };
        return { data: [], error: null };
      }

      if (_mode === 'upsert') {
        const prefer = 'resolution=merge-duplicates' +
          (_upsertOpts.onConflict ? ',on_conflict=' + _upsertOpts.onConflict : '');
        const r = await fetch(tableUrl, {
          method: 'POST',
          headers: Object.assign({}, hdrs, { Prefer: prefer }),
          body: JSON.stringify(_mutateData),
        });
        if (!r.ok) return { data: null, error: new Error(await r.text()) };
        return { data: [], error: null };
      }

      if (_mode === 'update') {
        const qs = buildFilterQS();
        const r = await fetch(tableUrl + (qs ? '?' + qs : ''), {
          method: 'PATCH',
          headers: Object.assign({}, hdrs, { Prefer: 'return=minimal' }),
          body: JSON.stringify(_mutateData),
        });
        if (!r.ok) return { data: null, error: new Error(await r.text()) };
        return { data: [], error: null };
      }

      if (_mode === 'delete') {
        const qs = buildFilterQS();
        const r = await fetch(tableUrl + (qs ? '?' + qs : ''), {
          method: 'DELETE',
          headers: Object.assign({}, hdrs, { Prefer: 'return=minimal' }),
        });
        if (!r.ok) return { data: null, error: new Error(await r.text()) };
        return { data: [], error: null };
      }

      // select (GET)
      const parts: string[] = ['select=' + encodeURIComponent(_select)];
      if (_filters.length) parts.push(..._filters);
      if (_limitN !== null) parts.push('limit=' + _limitN);
      const qs = parts.join('&');
      const r = await fetch(tableUrl + '?' + qs, { headers: hdrs });
      if (!r.ok) return { data: null, error: new Error(await r.text()) };
      return { data: (await r.json()) as Row[], error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
    }
  }

  const builder = {
    select(cols: string) { _select = cols; return builder; },
    eq(col: string, val: unknown) { _filters.push(col + '=eq.' + String(val)); return builder; },
    neq(col: string, val: unknown) { _filters.push(col + '=neq.' + String(val)); return builder; },
    in(col: string, vals: unknown[]) { _filters.push(col + '=in.(' + vals.join(',') + ')'); return builder; },
    gte(col: string, val: unknown) { _filters.push(col + '=gte.' + String(val)); return builder; },
    lte(col: string, val: unknown) { _filters.push(col + '=lte.' + String(val)); return builder; },
    limit(n: number) { _limitN = n; return builder; },
    insert(data: Row | Row[]) { _mode = 'insert'; _mutateData = data; return builder; },
    update(data: Row) { _mode = 'update'; _mutateData = data; return builder; },
    delete() { _mode = 'delete'; return builder; },
    upsert(data: Row | Row[], opts: Record<string, string> = {}) {
      _mode = 'upsert'; _mutateData = data; _upsertOpts = opts; return builder;
    },

    async maybeSingle(): Promise<SingleResult> {
      const res = await run();
      if (res.error) return { data: null, error: res.error };
      const rows = res.data || [];
      return { data: rows.length > 0 ? rows[0] : null, error: null };
    },

    single(): Promise<SingleResult> {
      return builder.maybeSingle();
    },

    get(): Promise<QueryResult> {
      return run();
    },

    // Thenable — allows `await builder` syntax
    then(
      resolve: ((v: QueryResult) => unknown) | null | undefined,
      reject: ((e: unknown) => unknown) | null | undefined
    ) {
      return run().then(resolve as never, reject as never);
    },
  };

  return builder;
}

export function getServiceSupabase() {
  const { url, key } = getEnv();
  return {
    from: (table: string) => makeBuilder(url, key, table),
    auth: {
      getUser: async (token: string): Promise<{ data: { user: { id: string } } | null; error: Error | null }> => {
        try {
          const r = await fetch(url + '/auth/v1/user', {
            headers: { apikey: key, Authorization: 'Bearer ' + token },
          });
          if (!r.ok) return { data: null, error: new Error('Invalid token') };
          const user = await r.json() as { id: string };
          return { data: { user }, error: null };
        } catch (e) {
          return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
        }
      },
    },
  };
}

export async function requireUserFromBearer(authHeader?: string | null) {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('Missing bearer token');
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw new Error('Invalid token');
  return { supabase, user: data.user, token };
}
