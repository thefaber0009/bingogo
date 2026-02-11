import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Ticket,
  ArrowLeft,
  Play,
  ShoppingCart,
  CheckCircle,
  Circle,
  Info,
  Trash2,
  Clock,
  Lock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CartonBingo from '../components/bingo/CartonBingo';
import { Switch } from '@/components/ui/switch';

export default function MisCartones() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const partidaId = urlParams.get('partida');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partida, isLoading: loadingPartida } = useQuery({
    queryKey: ['partida', partidaId],
    queryFn: () => base44.entities.Partida.filter({ id: partidaId }).then(r => r[0]),
    enabled: !!partidaId,
  });

  const { data: todosLosCartones = [], isLoading: loadingCartones } = useQuery({
    queryKey: ['misCartones', user?.id],
    queryFn: () => base44.entities.Carton.filter({ 
      jugador_id: user.id,
      comprado: true
    }),
    enabled: !!user?.id,
    refetchInterval: 3000,
  });

  const { data: todasLasPartidas = [] } = useQuery({
    queryKey: ['todasPartidas'],
    queryFn: () => base44.entities.Partida.list(),
    refetchInterval: 5000,
  });

  // Agrupar cartones por partida
  const cartonAgrupadosPorPartida = todosLosCartones.reduce((acc, carton) => {
    if (!acc[carton.partida_id]) {
      acc[carton.partida_id] = [];
    }
    acc[carton.partida_id].push(carton);
    return acc;
  }, {});

  const partidas = todasLasPartidas.filter(p => cartonAgrupadosPorPartida[p.id]);
  const cartones = partidaId ? todosLosCartones.filter(c => c.partida_id === partidaId) : todosLosCartones;

  const [cartonesHabilitados, setCartonesHabilitados] = useState({});
  const [tiemposCarton, setTiemposCarton] = useState({});

  useEffect(() => {
    // Inicializar tiempos de los cartones (5 minutos = 300 segundos)
    const nuevosTiempos = {};
    cartones.forEach(carton => {
      if (!tiemposCarton[carton.id]) {
        nuevosTiempos[carton.id] = 300;
      }
    });
    if (Object.keys(nuevosTiempos).length > 0) {
      setTiemposCarton(prev => ({ ...prev, ...nuevosTiempos }));
    }
  }, [cartones]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setTiemposCarton(prev => {
        const nuevo = { ...prev };
        Object.keys(nuevo).forEach(cartonId => {
          if (nuevo[cartonId] > 0) {
            nuevo[cartonId] -= 1;
          }
        });
        return nuevo;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  const toggleCarton = (cartonId) => {
    setCartonesHabilitados(prev => ({
      ...prev,
      [cartonId]: !prev[cartonId]
    }));
  };

  const deleteCartonMutation = useMutation({
    mutationFn: (cartonId) => base44.entities.Carton.delete(cartonId),
    onSuccess: () => {
      queryClient.invalidateQueries(['misCartones', partidaId, user?.id]);
    },
  });

  const handleEliminarCarton = (cartonId) => {
    if (confirm('¿Estás seguro de que deseas eliminar este cartón?')) {
      deleteCartonMutation.mutate(cartonId);
    }
  };

  const formatearTiempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
  };

  const cartonesActivos = Object.keys(cartonesHabilitados).filter(id => cartonesHabilitados[id]).length;

  // Calcular totales
  const totalCartones = todosLosCartones.length;
  const totalCosto = todosLosCartones.reduce((sum, carton) => {
    const partida = todasLasPartidas.find(p => p.id === carton.partida_id);
    return sum + (partida?.precio_carton || 0);
  }, 0);

  if (loadingCartones) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 mt-4">Cargando tus cartones...</p>
        </div>
      </div>
    );
  }

  if (todosLosCartones.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="py-12 text-center">
            <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">No tienes cartones en ninguna partida</p>
            <Link to={createPageUrl('Lobby')}>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ir a Comprar Cartones
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Lobby')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Mis Cartones</h1>
              <p className="text-slate-600">Visualiza tus cartones por sala</p>
            </div>
          </div>
        </div>

        {/* Información */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-indigo-600 mt-1" />
              <div>
                <p className="font-semibold text-slate-900 mb-1">Habilita tus cartones para jugar</p>
                <p className="text-sm text-slate-600">
                  Activa o desactiva los cartones que deseas usar en cada sala. 
                  Solo los cartones habilitados estarán activos durante el juego.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salas con Cartones */}
        <div className="space-y-8">
          {partidas.map((part) => {
            const cartonesPartida = cartonAgrupadosPorPartida[part.id] || [];
            const cartonesHabilitadosPartida = cartonesPartida.filter(c => cartonesHabilitados[c.id]).length;
            
            return (
              <div key={part.id} className="border-2 border-indigo-300 rounded-2xl p-6 bg-white shadow-lg">
                {/* Header de la Sala */}
                <div className="mb-6 pb-4 border-b-2 border-indigo-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{part.nombre}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          part.estado === 'en_curso' ? 'bg-green-100 text-green-700' :
                          part.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {part.estado === 'en_curso' ? '● Activa' : '● Inactiva'}
                        </span>
                        <span className="text-xs text-slate-500">ID: {part.id}</span>
                      </div>
                    </div>
                    <Link to={createPageUrl('ComprarCartones') + `?partida=${part.id}`}>
                      <Button variant="outline" size="sm">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Comprar más
                      </Button>
                    </Link>
                  </div>

                  {/* Datos de la Sala */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">📅 Hora Inicio</p>
                      <p className="font-semibold text-slate-900">{part.fecha_inicio ? new Date(part.fecha_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">🎫 Total</p>
                      <p className="font-semibold text-slate-900">{cartonesPartida.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">✓ Habilitados</p>
                      <p className="font-semibold text-green-600">{cartonesHabilitadosPartida}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">💰 Precio</p>
                      <p className="font-semibold text-slate-900">${part.precio_carton?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Cartones de la Sala */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {cartonesPartida.map((carton, idx) => {
                    const tiempoRestante = tiemposCarton[carton.id] || 300;
                    const tiempoAgotado = tiempoRestante === 0;
                    const estaPagado = carton.pagado === true;
                    return (
                    <Card key={carton.id} className={`border-2 transition-all duration-300 relative ${
                      tiempoAgotado && estaPagado ? 'border-red-400 shadow-xl bg-red-50' :
                      cartonesHabilitados[carton.id] && estaPagado
                        ? 'border-green-400 shadow-xl bg-green-50' 
                        : !estaPagado ? 'border-amber-300 shadow-lg bg-amber-50 opacity-75'
                        : 'border-slate-200 shadow-lg bg-white'
                    }`}>
                      {!estaPagado && (
                        <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center z-10">
                          <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
                            <Lock className="w-5 h-5 text-amber-600" />
                            <span className="font-bold text-amber-700 text-sm">Pendiente de pago</span>
                          </div>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Ticket className={`w-5 h-5 ${cartonesHabilitados[carton.id] && estaPagado ? 'text-green-600' : 'text-slate-400'}`} />
                            Cartón #{idx + 1}
                          </CardTitle>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100">
                            <Clock className={`w-4 h-4 ${tiempoAgotado ? 'text-red-600' : 'text-slate-600'}`} />
                            <span className={`text-sm font-bold ${tiempoAgotado ? 'text-red-600' : 'text-slate-600'}`}>
                              {formatearTiempo(tiempoRestante)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${cartonesHabilitados[carton.id] && estaPagado ? 'text-green-600' : 'text-slate-400'}`}>
                              {cartonesHabilitados[carton.id] && estaPagado ? 'Habilitado' : estaPagado ? 'Deshabilitado' : 'Bloqueado'}
                            </span>
                            <Switch
                              checked={cartonesHabilitados[carton.id] || false}
                              onCheckedChange={() => estaPagado && toggleCarton(carton.id)}
                              disabled={!estaPagado}
                            />
                          </div>
                          <button
                            onClick={() => handleEliminarCarton(carton.id)}
                            className="p-1.5 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                            title="Eliminar cartón"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CartonBingo 
                          carton={carton}
                          marcados={[]}
                          onMarcar={() => {}}
                          autoMarcar={true}
                        />
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>

                {/* Botón Entrar a Jugar por Sala */}
                {cartonesHabilitadosPartida > 0 && (
                  <div className="mt-6 flex justify-center">
                    <Button 
                      onClick={() => navigate(createPageUrl('SalaBingo') + `?partida=${part.id}`)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-3"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Entrar a {part.nombre} ({cartonesHabilitadosPartida} cartones)
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resumen de Compra */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Historial de Compras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Fecha</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Sala</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Cantidad</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Total</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidas.map((part) => {
                        const cartonesPartida = cartonAgrupadosPorPartida[part.id] || [];
                        const subtotal = cartonesPartida.length * (part.precio_carton || 0);
                        const fecha = new Date(part.fecha_inicio || new Date()).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'});
                        
                        return (
                          <tr key={part.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-700">{fecha}</td>
                            <td className="py-3 px-4">
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                🎫 {part.nombre}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">{cartonesPartida.length} cartones</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">${subtotal.toFixed(2)}</td>
                            <td className="py-3 px-4">
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                ✓ COMPLETADO
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen de Pago */}
          <Card className="border-0 shadow-xl h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                Resumen de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 text-center mb-4">
                <p className="text-sm text-slate-600 mb-1">Total Cartones</p>
                <p className="text-3xl font-bold text-indigo-600">{totalCartones}</p>
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Cartones:</span>
                  <span className="font-semibold text-slate-900">{totalCartones}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Combos:</span>
                  <span className="font-semibold text-slate-900">0</span>
                </div>
              </div>

              <div className="bg-slate-100 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-semibold text-slate-900">${totalCosto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Descuento:</span>
                  <span className="font-semibold text-slate-900">$0</span>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between">
                  <span className="font-bold text-slate-900">Total:</span>
                  <span className="font-bold text-lg text-indigo-600">${totalCosto.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 h-11 rounded-lg mt-4"
              >
                💳 Pagar ${totalCosto.toFixed(2)}
              </Button>

              <p className="text-xs text-slate-500 text-center">
                🔔 Los cartones se reservan por 5 minutos
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}