
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, ChevronDown, ChevronRight, RefreshCcw } from 'lucide-react';
import { useTimezone } from '@/hooks/useTimezone';

interface AppUser {
  id: string;
  name: string;
  email: string;
}

interface ConnectionLog {
  id?: string;
  user_id: string;
  event: string;
  created_at?: string;
  method?: string | null;
  path?: string | null;
  referrer?: string | null;
  user_agent?: string | null;
  success?: boolean | null;
  error_code?: string | null;
}

const UserActivityLogs: React.FC = () => {
  const { formatDateTime } = useTimezone();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<Record<string, ConnectionLog[]>>({});
  const [lastLogins, setLastLogins] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // Fetch users and latest sign-in logs in parallel
    const fetchData = async () => {
      try {
        const [usersRes, signinsRes] = await Promise.all([
          supabase.from('app_users').select('id, name, email'),
          (supabase as any)
            .from('user_connection_logs')
            .select('user_id, event, created_at')
            .eq('event', 'signed_in')
            .order('created_at', { ascending: false })
            .limit(1000)
        ]);

        if (!isMounted) return;

        if (usersRes.error) throw usersRes.error;
        if (signinsRes.error) throw signinsRes.error;

        const usersData = (usersRes.data || []) as AppUser[];
        setUsers(usersData);

        // Compute last login per user
        const lastMap: Record<string, string> = {};
        for (const row of signinsRes.data || []) {
          const uid = row.user_id as string;
          if (!lastMap[uid]) {
            lastMap[uid] = row.created_at as string;
          }
        }
        setLastLogins(lastMap);
      } catch (e: any) {
        console.error('[UserActivityLogs] Load error', e);
        setError(e?.message || 'Error loading data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? users.filter(u =>
          u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
        )
      : users;
    // sort by last login desc, unknown last
    return [...list].sort((a, b) => {
      const la = lastLogins[a.id];
      const lb = lastLogins[b.id];
      if (la && lb) return la > lb ? -1 : 1;
      if (la) return -1;
      if (lb) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [users, search, lastLogins]);

  const toggleExpand = async (userId: string) => {
    const isSame = expandedUserId === userId;
    const nextId = isSame ? null : userId;
    setExpandedUserId(nextId);

    if (nextId && !recentEvents[nextId]) {
      // lazy-load latest 10 events for this user
      const { data, error } = await (supabase as any)
        .from('user_connection_logs')
        .select('id, user_id, event, created_at, method, path, referrer, user_agent, success, error_code')
        .eq('user_id', nextId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) {
        console.warn('[UserActivityLogs] Load user events error', error);
        return;
      }
      setRecentEvents(prev => ({ ...prev, [nextId]: data as ConnectionLog[] }));
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Actividad de Usuarios</h3>
        <button
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm hover:bg-muted"
          onClick={() => setRefreshKey(k => k + 1)}
          aria-label="Refrescar"
        >
          <RefreshCcw className="w-4 h-4" /> Refrescar
        </button>
      </header>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          className="w-full rounded-md border pl-9 pr-3 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Cargando usuarios…</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <div className="divide-y rounded-md border">
          {filteredUsers.map((u) => {
            const last = lastLogins[u.id];
            const isOpen = expandedUserId === u.id;
            return (
              <article key={u.id} className="p-3">
                <button
                  className="w-full flex items-center gap-3 text-left"
                  onClick={() => toggleExpand(u.id)}
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{u.name || u.email}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Último inicio de sesión: {last ? formatDateTime(last) : '—'}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 rounded-md bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground mb-2">Últimos eventos</div>
                    <div className="overflow-x-auto -mx-3 px-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-muted-foreground">
                            <th className="py-2 pr-2 whitespace-nowrap" title="Fecha">
                              <span className="hidden sm:inline">Fecha</span>
                              <span className="sm:hidden">Fch.</span>
                            </th>
                            <th className="py-2 pr-2 whitespace-nowrap" title="Evento">
                              <span className="hidden sm:inline">Evento</span>
                              <span className="sm:hidden">Ev.</span>
                            </th>
                            <th className="py-2 pr-2 whitespace-nowrap" title="Método">
                              <span className="hidden sm:inline">Método</span>
                              <span className="sm:hidden">Mét.</span>
                            </th>
                            <th className="py-2 pr-2 whitespace-nowrap" title="Ruta">Ruta</th>
                            <th className="py-2 pr-2 text-center whitespace-nowrap" title="OK">OK</th>
                            <th className="py-2 whitespace-nowrap" title="Código">
                              <span className="hidden sm:inline">Código</span>
                              <span className="sm:hidden">Cód.</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(recentEvents[u.id] || []).map(ev => (
                            <tr key={ev.id || ev.created_at} className="border-t">
                              <td className="py-2 pr-2 whitespace-nowrap text-xs" title={ev.created_at ? formatDateTime(ev.created_at) : ''}>
                                {ev.created_at ? formatDateTime(ev.created_at) : ''}
                              </td>
                              <td className="py-2 pr-2 max-w-[100px] truncate" title={ev.event}>
                                {ev.event}
                              </td>
                              <td className="py-2 pr-2 text-xs" title={ev.method || '-'}>
                                {ev.method || '-'}
                              </td>
                              <td className="py-2 pr-2 max-w-[120px] truncate text-xs" title={ev.path || '-'}>
                                {ev.path || '-'}
                              </td>
                              <td className="py-2 pr-2 text-center text-xs">
                                {ev.success === false ? 'No' : 'Sí'}
                              </td>
                              <td className="py-2 text-xs" title={ev.error_code || '-'}>
                                {ev.error_code || '-'}
                              </td>
                            </tr>
                          ))}
                          {(!recentEvents[u.id] || recentEvents[u.id].length === 0) && (
                            <tr>
                              <td className="py-3 text-sm text-muted-foreground text-center" colSpan={6}>Sin eventos recientes</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default UserActivityLogs;
