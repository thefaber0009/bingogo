import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  GamepadIcon, 
  Trophy, 
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Estado de Partidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div>
                <p className="text-sm text-slate-600 font-medium">En Curso</p>
                <p className="text-2xl font-bold text-green-600">{partidasActivas.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
              <div>
                <p className="text-sm text-slate-600 font-medium">Pendientes</p>
                <p className="text-2xl font-bold text-amber-600">{partidasPendientes.length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <GamepadIcon className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Últimas Transacciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transacciones.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 capitalize">{t.tipo}</p>
                    <p className="text-xs text-slate-500">{new Date(t.created_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${
                      t.estado === 'confirmada' ? 'text-green-600' : 
                      t.estado === 'pendiente' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      ${t.monto?.toFixed(2)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      t.estado === 'confirmada' ? 'bg-green-100 text-green-700' : 
                      t.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {t.estado}
                    </span>
                  </div>
                </div>
              ))}
              {transacciones.length === 0 && (
                <p className="text-center text-slate-500 py-8">No hay transacciones registradas</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}