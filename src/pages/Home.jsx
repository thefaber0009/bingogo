import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
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
  Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Resumen general de la plataforma BingoGo</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partidas.map((partida) => (
            <Card key={partida.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Gem className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">{partida.nombre}</h3>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    partida.estado === 'en_curso' ? 'bg-green-100 text-green-700' :
                    partida.estado === 'pendiente' ? 'bg-slate-200 text-slate-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {partida.estado === 'en_curso' ? 'Activa' : 
                     partida.estado === 'pendiente' ? 'Inactiva' : 'Finalizada'}
                  </span>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span className="text-slate-700">{partida.cantidad_total_cartones} cartones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <span className="text-slate-700">Premio$ {(partida.modos_juego?.reduce((sum, m) => sum + (m.premio || 0), 0) || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎮</span>
                    <span className="text-slate-700">{partida.modos_juego?.length || 0} modos de juego</span>
                  </div>
                </div>

                {/* Game Modes */}
                {partida.modos_juego && partida.modos_juego.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {partida.modos_juego.map((modo, idx) => (
                      <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {modo.nombre} (${modo.premio || 0})
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                    <Edit2 className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs text-red-600 hover:text-red-700">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Eliminar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                    Panel
                  </Button>
                  <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700">
                    <Play className="w-3 h-3 mr-1" />
                    {partida.estado === 'en_curso' ? 'Activar' : 'Iniciar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}