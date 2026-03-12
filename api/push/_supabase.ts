/**
 * Mini Supabase REST client using fetch() — no @supabase/supabase-js dependency.
 * Exposes the same interface used by the existing API handlers.
 */

function getEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return { url, key };
}

function baseHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

type FilterOp = 'eq' | 'in' | 'gte' | 'lte' | 'neq';

interface Filter {
  col: string;
  op: FilterOp;
  val: unknown;
}

class SupabaseQueryBuilder {
  private _table: string;
  private _url: string;
  private _key: string;
  private _select: string | null = null;
  private _filters: Filter[] = [];
  private _updateData: Record<string, unknown> | null = null;
  private _insertData: Record<string, unknown> | Record<string, unknown>[] | null = null;

  constructor(url: string, key: string, table: string) {
    this._url = url;
    this._key = key;
    this._table = table;
  }

  select(cols: string): this {
    this._select = cols;
    return this;
  }

  eq(col: string, val: unknown): this {
    this._filters.push({ col, op: 'eq', val });
    return this;
  }

  in(col: string, vals: unknown[]): this {
    this._filters.push({ col, op: 'in', val: vals });
    return this;
  }

  gte(col: string, val: unknown): this {
    this._filters.push({ col, op: 'gte', val });
    return this;
  }

  lte(col: string, val: unknown): this {
    this._filters.push({ col, op: 'lte', val });
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): this {
    this._insertData = data;
    return this;
  }

  update(data: Record<string, unknown>): this {
    this._updateData = data;
    return this;
  }

  private buildUrl(extra?: Record<string, string>): string {
    const params = new URLSearchParams();
    if (this._select) params.set('select', this._select);
    for (const f of this._filters) {
      if (f.op === 'in') {
        params.set(f.col, `in.(${(f.val as unknown[]).join(',')})`);
      } else {
        params.set(f.col, `${f.op}.${f.val}`);
      }
    }
    if (extra) {
      for (const [k, v] of Object.entries(extra)) params.set(k, v);
    }
    const qs = params.toString();
    return `${this._url}/rest/v1/${this._table}${qs ? '?' + qs : ''}`;
  }

  async maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: Error | null }> {
    try {
      const res = await fetch(this.buildUrl(), {
        headers: {
          ...baseHeaders(this._key),
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        const body = await res.text();
        return { data: null, error: new Error(body) };
      }
      const rows: Record<string, unknown>[] = await res.json();
      return { data: rows.length > 0 ? rows[0] : null, error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
    }
  }

  async execute(): Promise<{ data: Record<string, unknown>[] | null; error: Error | null }> {
    try {
      let method = 'GET';
      let body: string | undefined;
      let url = this.buildUrl();

      if (this._insertData !== null) {
        method = 'POST';
        body = JSON.stringify(this._insertData);
      } else if (this._updateData !== null) {
        method = 'PATCH';
        body = JSON.stringify(this._updateData);
      }

      const res = await fetch(url, {
        method,
        headers: {
          ...baseHeaders(this._key),
          Accept: 'application/json',
          Prefer: 'return=minimal',
        },
        body,
      });

      if (!res.ok) {
        const text = await res.text();
        return { data: null, error: new Error(text) };
      }

      // For mutating operations, return empty data array (Prefer: return=minimal)
      if (method !== 'GET') {
        return { data: [], error: null };
      }

      const rows: Record<string, unknown>[] = await res.json();
      return { data: rows, error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
    }
  }

  // Make the builder thenable so `await supabase.from(...).select(...).eq(...)` works
  then<TResult1 = { data: Record<string, unknown>[] | null; error: Error | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: Record<string, unknown>[] | null; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Wraps a SupabaseQueryBuilder to give it an .error property once resolved
// and adds single()/maybeSingle() returning promises directly.
function makeProxy(builder: SupabaseQueryBuilder): SupabaseQueryBuilder & {
  single(): Promise<{ data: Record<string, unknown> | null; error: Error | null }>;
} {
  return Object.assign(builder, {
    single() {
      return builder.maybeSingle();
    },
  });
}

interface MiniSupabaseClient {
  from(table: string): ReturnType<typeof makeProxy>;
  auth: {
    getUser(token: string): Promise<{
      data: { user: { id: string; email?: string } } | null;
      error: Error | null;
    }>;
  };
}

export function getServiceSupabase(): MiniSupabaseClient {
  const { url, key } = getEnv();
  return {
    from: (table: string) => makeProxy(new SupabaseQueryBuilder(url, key, table)),
    auth: {
      async getUser(token: string) {
        try {
          const res = await fetch(`${url}/auth/v1/user`, {
            headers: {
              apikey: key,
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) {
            return { data: null, error: new Error('Invalid token') };
          }
          const user = await res.json();
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
