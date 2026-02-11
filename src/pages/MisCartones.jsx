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
  Clock
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

  const entrarASala = () => {
    if (cartonesActivos === 0) {
      alert('Debes habilitar al menos un cartón para jugar');
      return;
    }
    navigate(createPageUrl('SalaBingo') + `?partida=${partidaId}`);
  };

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
                    return (
                    <Card key={carton.id} className={`border-2 transition-all duration-300 ${
                      tiempoAgotado ? 'border-red-400 shadow-xl bg-red-50' :
                      cartonesHabilitados[carton.id] 
                        ? 'border-green-400 shadow-xl bg-green-50' 
                        : 'border-slate-200 shadow-lg bg-white'
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Ticket className={`w-5 h-5 ${cartonesHabilitados[carton.id] ? 'text-green-600' : 'text-slate-400'}`} />
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
                            <span className={`text-sm font-semibold ${cartonesHabilitados[carton.id] ? 'text-green-600' : 'text-slate-400'}`}>
                              {cartonesHabilitados[carton.id] ? 'Habilitado' : 'Deshabilitado'}
                            </span>
                            <Switch
                              checked={cartonesHabilitados[carton.id] || false}
                              onCheckedChange={() => toggleCarton(carton.id)}
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
      </div>
    </div>
  );
}