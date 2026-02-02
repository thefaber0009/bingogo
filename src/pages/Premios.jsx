import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Trophy,
  DollarSign,
  CheckCircle,
  Clock,
  Loader2,
  User
} from 'lucide-react';

export default function Premios() {
  const queryClient = useQueryClient();

  const { data: premios = [], isLoading } = useQuery({
    queryKey: ['premios'],
    queryFn: () => base44.entities.Premio.list('-created_date'),
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list(),
  });

  const updatePremioMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Premio.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['premios']);
    },
  });

  const marcarComoPagado = (premio) => {
    if (confirm('¿Confirmar que el premio ha sido pagado?')) {
      updatePremioMutation.mutate({
        id: premio.id,
        data: { estado_pago: 'pagado', fecha_pago: new Date().toISOString() }
      });
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
      en_proceso: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Loader2 },
      pagado: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    };
    const badge = badges[estado] || badges.pendiente;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {estado}
      </span>
    );
  };

  const getUsuarioNombre = (jugadorId) => {
    const usuario = usuarios.find(u => u.id === jugadorId);
    return usuario?.full_name || 'Usuario desconocido';
  };

  const premiosPendientes = premios.filter(p => p.estado_pago !== 'pagado');
  const premiosPagados = premios.filter(p => p.estado_pago === 'pagado');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Gestión de Premios</h1>
        <p className="text-slate-600 mt-1">Administra los premios y pagos a ganadores</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Pendientes</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{premiosPendientes.length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Pagados</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{premiosPagados.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Pagado</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">
                  ${premiosPagados.reduce((sum, p) => sum + (p.valor || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Premios Pendientes */}
          {premiosPendientes.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Premios Pendientes de Pago</h2>
              <div className="grid gap-4">
                {premiosPendientes.map((premio) => (
                  <Card key={premio.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <Trophy className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{premio.nombre}</h3>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1 text-sm text-slate-600">
                                <User className="w-3 h-3" />
                                {getUsuarioNombre(premio.jugador_id)}
                              </div>
                              <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                                <DollarSign className="w-3 h-3" />
                                {premio.valor?.toFixed(2)}
                              </div>
                            </div>
                            <div className="mt-2">
                              {getEstadoBadge(premio.estado_pago)}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => marcarComoPagado(premio)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={updatePremioMutation.isLoading}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Marcar como Pagado
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Premios Pagados */}
          {premiosPagados.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Historial de Premios Pagados</h2>
              <div className="grid gap-4">
                {premiosPagados.map((premio) => (
                  <Card key={premio.id} className="border-0 shadow-lg opacity-75">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                            <Trophy className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{premio.nombre}</h3>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1 text-sm text-slate-600">
                                <User className="w-3 h-3" />
                                {getUsuarioNombre(premio.jugador_id)}
                              </div>
                              <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                                <DollarSign className="w-3 h-3" />
                                {premio.valor?.toFixed(2)}
                              </div>
                              {premio.fecha_pago && (
                                <span className="text-xs text-slate-500">
                                  Pagado: {new Date(premio.fecha_pago).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div className="mt-2">
                              {getEstadoBadge(premio.estado_pago)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {premios.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-12 text-center">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No hay premios registrados</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}