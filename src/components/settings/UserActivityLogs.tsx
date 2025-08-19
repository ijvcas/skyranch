
import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronRight, RefreshCcw } from 'lucide-react';
import { getUserRoleSecure, getAuthenticatedUser } from '@/services/coreDataService';
import { supabase } from '@/integrations/supabase/client';

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
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<Record<string, ConnectionLog[]>>({});
  const [lastLogins, setLastLogins] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const initializeComponent = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check authentication and permissions first
        const user = await getAuthenticatedUser();
        if (!user) {
          throw new Error('No authenticated user');
        }

        const role = await getUserRoleSecure();
        const isAdmin = role === 'admin';
        setHasPermission(isAdmin);

        if (!isAdmin) {
          setError('Se requieren permisos de administrador para ver los registros de actividad');
          return;
        }

        // Fetch data only if user has permission
        const [usersRes, signinsRes] = await Promise.all([
          supabase.from('app_users').select('id, name, email'),
          supabase
            .from('user_connection_logs')
            .select('user_id, event, created_at')
            .eq('event', 'signed_in')
            .order('created_at', { ascending: false })
            .limit(1000)
        ]);

        if (!isMounted) return;

        if (usersRes.error) {
          console.error('Users query error:', usersRes.error);
          throw new Error(`Error cargando usuarios: ${usersRes.error.message}`);
        }
        
        if (signinsRes.error) {
          console.error('Sign-ins query error:', signinsRes.error);
          throw new Error(`Error cargando histórico de accesos: ${signinsRes.error.message}`);
        }

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
        if (isMounted) {
          setError(e?.message || 'Error loading data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeComponent();
    
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
    if (!hasPermission) return;
    
    const isSame = expandedUserId === userId;
    const nextId = isSame ? null : userId;
    setExpandedUserId(nextId);

    if (nextId && !recentEvents[nextId]) {
      try {
        // lazy-load latest 10 events for this user
        const { data, error } = await supabase
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
      } catch (error) {
        console.warn('[UserActivityLogs] Exception loading user events', error);
      }
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
        <div className="text-sm text-muted-foreground">Cargando usuarios...</div>
      )}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border">
          {error}
        </div>
      )}
      {!hasPermission && !loading && !error && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          Se requieren permisos de administrador para acceder a esta función.
        </div>
      )}

      {!loading && !error && hasPermission && (
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
                    <div className="font-medium">{u.name || u.email}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Último inicio de sesión: {last ? new Date(last).toLocaleString() : '—'}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 rounded-md bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground mb-2">Últimos eventos</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-muted-foreground">
                            <th className="py-2 pr-3">Fecha</th>
                            <th className="py-2 pr-3">Evento</th>
                            <th className="py-2 pr-3">Método</th>
                            <th className="py-2 pr-3">Ruta</th>
                            <th className="py-2 pr-3">OK</th>
                            <th className="py-2 pr-3">Código</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(recentEvents[u.id] || []).map(ev => (
                            <tr key={ev.id || ev.created_at} className="border-t">
                              <td className="py-2 pr-3 whitespace-nowrap">{ev.created_at ? new Date(ev.created_at).toLocaleString() : ''}</td>
                              <td className="py-2 pr-3">{ev.event}</td>
                              <td className="py-2 pr-3">{ev.method || '-'}</td>
                              <td className="py-2 pr-3">{ev.path || '-'}</td>
                              <td className="py-2 pr-3">{ev.success === false ? 'No' : 'Sí'}</td>
                              <td className="py-2 pr-3">{ev.error_code || '-'}</td>
                            </tr>
                          ))}
                          {(!recentEvents[u.id] || recentEvents[u.id].length === 0) && (
                            <tr>
                              <td className="py-3 text-sm text-muted-foreground" colSpan={6}>Sin eventos recientes</td>
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
