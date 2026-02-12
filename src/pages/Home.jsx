import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  GamepadIcon, 
  Trophy, 
  DollarSign,
  TrendingUp,
  Activity,
  Gem,
  Edit2,
  Trash2,
  Power,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PanelAdminPartida from '@/components/partidas/PanelAdminPartida';
import DashboardSettingsDialog from '@/components/dashboard/DashboardSettingsDialog';

export default function Home() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [partidaSeleccionada, setPartidaSeleccionada] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: partidas = [] } = useQuery({
    queryKey: ['partidas'],
    queryFn: () => base44.entities.Partida.list(),
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: premios = [] } = useQuery({
    queryKey: ['premios'],
    queryFn: () => base44.entities.Premio.list(),
  });

  const { data: transacciones = [] } = useQuery({
    queryKey: ['transacciones'],
    queryFn: () => base44.entities.Transaccion.list(),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, estado }) => base44.entities.Partida.update(id, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries(['partidas']);
    },
  });

  const handleToggleActive = (partida) => {
    const nuevoEstado = partida.estado === 'en_curso' ? 'pendiente' : 'en_curso';
    toggleActiveMutation.mutate({ id: partida.id, estado: nuevoEstado });
  };

  const stats = [
    {
      title: 'Usuarios Activos',
      value: usuarios.length,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Partidas Totales',
      value: partidas.length,
      icon: GamepadIcon,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Premios Entregados',
      value: premios.filter(p => p.estado_pago === 'pagado').length,
      icon: Trophy,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      title: 'Ingresos Totales',
      value: `$${transacciones
        .filter(t => t.tipo === 'pago' && t.estado === 'confirmada')
        .reduce((sum, t) => sum + (t.monto || 0), 0)
        .toFixed(2)}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  const partidasActivas = partidas.filter(p => p.estado === 'en_curso');
  const partidasPendientes = partidas.filter(p => p.estado === 'pendiente');

  return (
    <>
      {partidaSeleccionada && (
        <PanelAdminPartida 
          partida={partidaSeleccionada} 
          open={panelOpen} 
          onOpenChange={setPanelOpen}
        />
      )}
      <DashboardSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600">Resumen general de la plataforma BingoManía</p>
          </div>
          <Button 
            onClick={() => setSettingsOpen(true)}
            variant="outline"
            size="icon"
            className="h-10 w-10"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Partidas Grid */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Mis Salas</h2>
        <div className="grid grid-cols-1 gap-4">
          {partidas.map((partida) => (
            <Card key={partida.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">👻</span>
                    <h3 className="font-bold text-lg text-slate-900">{partida.nombre}</h3>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    partida.estado === 'en_curso' ? 'bg-green-100 text-green-700' :
                    partida.estado === 'pendiente' ? 'bg-slate-400 text-white' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {partida.estado === 'en_curso' ? 'Activa' : 
                     partida.estado === 'pendiente' ? 'Inactiva' : 'Finalizada'}
                  </span>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔵</span>
                    <span className="text-slate-900 font-medium">{partida.cantidad_total_cartones} cartones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <span className="text-slate-900">Premio$ {(partida.modos_juego?.reduce((sum, m) => sum + (m.premio || 0), 0) || 0).toLocaleString()}</span>
                  </div>
                  {partida.duracion_maxima && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⏱️</span>
                      <span className="text-slate-900">Duración: {partida.duracion_maxima} minutos</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <span className="text-slate-900">Inicio: {partida.fecha_inicio ? new Date(partida.fecha_inicio).toLocaleString('es-ES', { month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💬</span>
                    <span className="text-slate-900">{partida.modos_juego?.length || 0} modos de juego</span>
                  </div>
                </div>

                {/* Game Modes */}
                {partida.modos_juego && partida.modos_juego.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {partida.modos_juego.map((modo, idx) => (
                      <span key={idx} className="text-xs border border-blue-400 text-blue-700 px-3 py-1 rounded-full">
                        {modo.nombre} (${modo.premio || 0})
                      </span>
                    ))}
                  </div>
                )}

                {/* Combos Table */}
                {partida.combos && partida.combos.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💚</span>
                      <h4 className="font-bold text-slate-900">Combos disponibles:</h4>
                    </div>
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-300 bg-white">
                            <th className="text-left px-4 py-3 font-bold text-slate-900 border-r border-slate-300">Combo</th>
                            <th className="text-center px-4 py-3 font-bold text-slate-900 border-r border-slate-300">Cartones</th>
                            <th className="text-right px-4 py-3 font-bold text-slate-900">Precio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partida.combos.map((combo, idx) => (
                            <tr key={idx} className="border-b border-slate-300 last:border-b-0">
                              <td className="px-4 py-3 text-blue-600 font-medium border-r border-slate-300">{combo.nombre || `Combo ${idx + 1}`}</td>
                              <td className="text-center px-4 py-3 text-slate-900 border-r border-slate-300">{combo.cantidad}</td>
                              <td className="text-right px-4 py-3 text-orange-600 font-semibold">$ {combo.precio?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 flex-wrap">
                  <Button size="sm" variant="outline" className="h-9 text-xs px-3">
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 text-xs px-3 text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-9 text-xs px-3"
                    onClick={() => {
                      setPartidaSeleccionada(partida);
                      setPanelOpen(true);
                    }}
                  >
                    Panel
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 text-xs px-3">
                    Iniciar
                  </Button>
                  <Button 
                    size="sm" 
                    className={`h-9 text-xs px-3 ${partida.estado === 'en_curso' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                    onClick={() => handleToggleActive(partida)}
                    disabled={toggleActiveMutation.isLoading || partida.estado === 'finalizada'}
                  >
                    <Power className="w-4 h-4 mr-1" />
                    {partida.estado === 'en_curso' ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
        </div>
        </>
        );
        }