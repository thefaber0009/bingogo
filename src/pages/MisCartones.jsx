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
  Lock,
  Trophy,
  DollarSign,
  Settings
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CartonBingo from '../components/bingo/CartonBingo';
import BolasDisplay from '../components/bingo/BolasDisplay';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CreditCard, Wallet } from 'lucide-react';
import ClientSettingsMenu from '../components/settings/ClientSettingsMenu';

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

  const { data: premios = [] } = useQuery({
    queryKey: ['misPremios', user?.id],
    queryFn: () => base44.entities.Premio.filter({ jugador_id: user.id }),
    enabled: !!user?.id,
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
  const [dialogoPagoAbierto, setDialogoPagoAbierto] = useState(false);
  const [dialogoConfiguracionAbierto, setDialogoConfiguracionAbierto] = useState(false);
  const [tiempoActual, setTiempoActual] = useState(Date.now());

  // Calcular tiempo restante basado en fecha_compra del cartón
  const calcularTiempoRestante = (carton) => {
    if (carton.pagado) return null;
    const fechaCompra = new Date(carton.fecha_compra);
    const ahora = new Date(tiempoActual);
    const tiempoTranscurrido = Math.floor((ahora - fechaCompra) / 1000);
    const tiempoRestante = Math.max(0, 300 - tiempoTranscurrido);
    return tiempoRestante;
  };

  useEffect(() => {
    const intervalo = setInterval(() => {
      setTiempoActual(Date.now());
      
      // Verificar cartones expirados
      cartones.forEach(carton => {
        if (!carton.pagado) {
          const tiempoRestante = calcularTiempoRestante(carton);
          if (tiempoRestante === 0) {
            deleteCartonMutation.mutate(carton.id);
          }
        }
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [cartones]);

  const toggleCarton = (cartonId) => {
    setCartonesHabilitados(prev => ({
      ...prev,
      [cartonId]: !prev[cartonId]
    }));
  };

  const deleteCartonMutation = useMutation({
    mutationFn: (cartonId) => base44.entities.Carton.update(cartonId, {
      jugador_id: null,
      comprado: false,
      pagado: false,
      marcados: []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['misCartones', user?.id]);
      queryClient.invalidateQueries(['todosLosCartones']);
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
  const cartonesPendientes = todosLosCartones.filter(c => !c.pagado);
  const totalCosto = cartonesPendientes.reduce((sum, carton) => {
    const partida = todasLasPartidas.find(p => p.id === carton.partida_id);
    return sum + (partida?.precio_carton || 0);
  }, 0);

  // Estadísticas del usuario
  const cartonesEnJuego = todosLosCartones.filter(c => c.estado === 'activo').length;
  const cartonesGanadores = todosLosCartones.filter(c => c.estado === 'ganador').length;
  const totalPremios = premios.reduce((sum, p) => sum + (p.valor || 0), 0);
  const saldoDisponible = totalPremios; // En una implementación real, restaríamos las compras

  // Salas activas disponibles
  const salasActivas = todasLasPartidas.filter(p => p.estado === 'en_curso');

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
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header con Bienvenida */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-3 sm:p-6 text-white">
          <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Link to={createPageUrl('Lobby')}>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 border-white/30 hover:bg-white/30 flex-shrink-0 mt-0.5">
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-2xl font-bold truncate leading-tight">¡Bienvenido, {user?.full_name?.split(' ')[0] || 'Jugador'}!</h1>
                <p className="text-xs sm:text-sm text-white/90 flex items-center gap-1 sm:gap-2 flex-wrap mt-0.5">
                  <span className="hidden sm:inline">📅 {new Date().toLocaleDateString('es-ES', {day: 'numeric', month: '2-digit'})}</span>
                  <span className="sm:hidden">📅 {new Date().toLocaleDateString('es-ES', {month: 'short', day: 'numeric'})}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>🕐 {new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</span>
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setDialogoConfiguracionAbierto(true)}
              variant="outline" 
              size="icon" 
              className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 border-white/30 hover:bg-white/30 flex-shrink-0"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </Button>
          </div>
          <div className="hidden lg:flex items-center gap-2 mt-3 pt-3 border-t border-white/20">
            <Trophy className="w-4 h-4" />
            <p className="text-sm text-white/90">Saldo disponible:</p>
            <p className="text-xl sm:text-2xl font-bold">${saldoDisponible.toFixed(3)}</p>
          </div>
        </div>

        {/* Estadísticas del Usuario */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-blue-100 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{totalCartones}</p>
              <p className="text-xs text-slate-600">Cartones Totales</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-green-100 rounded-xl flex items-center justify-center">
                <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{cartonesEnJuego}</p>
              <p className="text-xs text-slate-600">En Juego</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{cartonesGanadores}</p>
              <p className="text-xs text-slate-600">Cartones Ganadores</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">${totalCosto.toFixed(3)}</p>
              <p className="text-xs text-slate-600">Total Gastado</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-white/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">${totalPremios.toFixed(3)}</p>
              <p className="text-xs text-white/90">Premios Ganados</p>
            </CardContent>
          </Card>
        </div>

        {/* Salas Disponibles */}
        {salasActivas.length > 0 && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Play className="w-5 h-5 text-indigo-600" />
                  Salas Disponibles
                </CardTitle>
                <span className="text-xs sm:text-sm font-bold px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  {salasActivas.length} salas activas
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-3">
                {salasActivas.map((sala) => (
                  <div key={sala.id} className="border-2 border-green-300 bg-green-50 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                          ◆
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{sala.nombre}</h3>
                          <span className="text-xs font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            ● Activa
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500">📅 Inicio</p>
                          <p className="font-bold text-slate-900">{sala.fecha_inicio ? new Date(sala.fecha_inicio).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'}) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">🕐 Hora</p>
                          <p className="font-bold text-slate-900">{sala.fecha_inicio ? new Date(sala.fecha_inicio).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">🏆 Premio</p>
                          <p className="font-bold text-green-700">${sala.modos_juego?.reduce((sum, m) => sum + (m.premio || 0), 0).toFixed(3) || '0'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">🎫 Disponibles</p>
                          <p className="font-bold text-blue-600">{(sala.cantidad_total_cartones || 0) - (sala.cartones_vendidos || 0)}</p>
                        </div>
                      </div>
                      {sala.fecha_inicio && new Date(sala.fecha_inicio) > new Date() && (
                        <div className="mt-2 text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                            ⏱️ Inicia en: {(() => {
                              const diff = Math.max(0, Math.floor((new Date(sala.fecha_inicio) - new Date()) / 1000));
                              const horas = Math.floor(diff / 3600);
                              const minutos = Math.floor((diff % 3600) / 60);
                              const segundos = diff % 60;
                              return `${horas}h ${minutos}m ${segundos}s`;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    <Link to={createPageUrl('ComprarCartones') + `?partida=${sala.id}`} className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold whitespace-nowrap">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Comprar
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Salas con Cartones */}
        <div className="space-y-6 sm:space-y-8">
          {partidas.map((part) => {
            const cartonesPartida = cartonAgrupadosPorPartida[part.id] || [];
            const cartonesHabilitadosPartida = cartonesPartida.filter(c => cartonesHabilitados[c.id]).length;
            
            return (
              <div key={part.id} className="border-2 border-indigo-300 rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-white shadow-lg">
                {/* Header de la Sala */}
                <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-indigo-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                    <div className="w-full sm:w-auto">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{part.nombre}</h2>
                      <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 sm:px-3 py-1 rounded-full ${
                          part.estado === 'en_curso' ? 'bg-green-100 text-green-700' :
                          part.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {part.estado === 'en_curso' ? '● Activa' : '● Inactiva'}
                        </span>
                        <span className="text-xs text-slate-500 hidden sm:inline">ID: {part.id}</span>
                      </div>
                    </div>
                    <Link to={createPageUrl('ComprarCartones') + `?partida=${part.id}`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Comprar más
                      </Button>
                    </Link>
                  </div>

                  {/* Datos de la Sala */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div>
                      <p className="text-xs text-slate-500">📅 Hora Inicio</p>
                      <p className="font-semibold text-sm sm:text-base text-slate-900">{part.fecha_inicio ? new Date(part.fecha_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</p>
                      {part.fecha_inicio && new Date(part.fecha_inicio) > new Date() && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                          ⏱️ {(() => {
                            const diff = Math.max(0, Math.floor((new Date(part.fecha_inicio) - new Date()) / 1000));
                            const horas = Math.floor(diff / 3600);
                            const minutos = Math.floor((diff % 3600) / 60);
                            const segundos = diff % 60;
                            return `${horas}h ${minutos}m ${segundos}s`;
                          })()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">🎫 Total</p>
                      <p className="font-semibold text-sm sm:text-base text-slate-900">{cartonesPartida.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{cartonesPartida.filter(c => c.pagado).length > 0 ? '✓ Habilitados' : '✗ Desabilitado'}</p>
                      <p className={`font-semibold text-sm sm:text-base ${cartonesPartida.filter(c => c.pagado).length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {cartonesPartida.filter(c => c.pagado).length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">💰 Precio</p>
                      <p className="font-semibold text-sm sm:text-base text-slate-900">${part.precio_carton?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Cartones de la Sala */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {cartonesPartida.sort((a, b) => a.numero_carton - b.numero_carton).map((carton) => {
                    const tiempoRestante = calcularTiempoRestante(carton) || 0;
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
                          <div className="bg-white rounded-lg px-4 py-3 text-center shadow-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Lock className="w-5 h-5 text-amber-600" />
                              <span className="font-bold text-amber-700 text-sm">Pendiente de pago</span>
                            </div>
                            <div className="flex items-center justify-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                              <Clock className="w-3 h-3" />
                              {formatearTiempo(tiempoRestante)}
                            </div>
                          </div>
                        </div>
                      )}
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2 flex-1">
                            <Ticket className={`w-4 h-4 sm:w-5 sm:h-5 ${estaPagado ? 'text-indigo-600' : 'text-amber-600'}`} />
                            <span className="truncate">Cartón #{carton.numero_carton} - {carton.id.substring(0, 6).toUpperCase()}</span>
                          </CardTitle>
                          <button
                            onClick={() => handleEliminarCarton(carton.id)}
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-all flex items-center justify-center relative z-20 pointer-events-auto shadow-md hover:shadow-lg flex-shrink-0"
                            title="Eliminar cartón"
                          >
                            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-6">
                        <div className="max-w-md mx-auto">
                          <CartonBingo 
                            carton={carton}
                            marcados={[]}
                            onMarcar={() => {}}
                            autoMarcar={true}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>

                {/* Botón Entrar a Jugar por Sala */}
                {cartonesHabilitadosPartida > 0 && (
                  <div className="mt-4 sm:mt-6 flex justify-center">
                    <Button 
                      onClick={() => navigate(createPageUrl('SalaBingo') + `?partida=${part.id}`)}
                      className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 sm:px-8 py-3 text-sm sm:text-base"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Entrar a {part.nombre} ({cartonesHabilitadosPartida})
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resumen de Compra */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  Historial de Compras
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-slate-600">Fecha</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-slate-600">Sala</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-slate-600 hidden sm:table-cell">Cantidad</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-slate-600">Total</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-slate-600 hidden lg:table-cell">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidas.map((part) => {
                        const cartonesPartida = cartonAgrupadosPorPartida[part.id] || [];
                        const subtotal = cartonesPartida.length * (part.precio_carton || 0);
                        const fecha = new Date(part.fecha_inicio || new Date()).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'});
                        
                        return (
                          <tr key={part.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-700">{fecha}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                                🎫 {part.nombre}
                              </span>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 font-semibold text-slate-900 hidden sm:table-cell">{cartonesPartida.length} cartones</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 font-semibold text-slate-900">${subtotal.toFixed(2)}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                              <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
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
          <Card className="border-0 shadow-xl h-fit lg:sticky lg:top-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                Resumen de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 sm:p-4 text-center mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Cartones Pendientes</p>
                <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{cartonesPendientes.length}</p>
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-3 sm:pt-4">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-600">Cartones:</span>
                  <span className="font-semibold text-slate-900">{cartonesPendientes.length}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-600">Combos:</span>
                  <span className="font-semibold text-slate-900">0</span>
                </div>
              </div>

              <div className="bg-slate-100 rounded-lg p-2.5 sm:p-3 space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-semibold text-slate-900">${totalCosto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-600">Descuento:</span>
                  <span className="font-semibold text-slate-900">$0</span>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between">
                  <span className="font-bold text-sm sm:text-base text-slate-900">Total:</span>
                  <span className="font-bold text-base sm:text-lg text-indigo-600">${totalCosto.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                onClick={() => setDialogoPagoAbierto(true)}
                disabled={cartonesPendientes.length === 0}
                className={`w-full font-bold py-2.5 sm:py-3 h-auto rounded-lg mt-3 sm:mt-4 text-sm sm:text-base ${
                  cartonesPendientes.length > 0 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                💳 Pagar ${totalCosto.toFixed(2)}
              </Button>

              <p className="text-xs text-slate-500 text-center">
                🔔 Los cartones se reservan por 5 minutos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Menú de Configuración */}
        <ClientSettingsMenu 
          open={dialogoConfiguracionAbierto} 
          onOpenChange={setDialogoConfiguracionAbierto}
          user={user}
        />

        {/* Diálogo de Opciones de Pago */}
        <Dialog open={dialogoPagoAbierto} onOpenChange={setDialogoPagoAbierto}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Elegir Método de Pago</DialogTitle>
              <DialogDescription>
                Selecciona cómo deseas pagar ${totalCosto.toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  // Marcar solo los cartones pendientes como pagados
                  const promesas = cartonesPendientes.map(carton => 
                    base44.entities.Carton.update(carton.id, { pagado: true })
                  );
                  await Promise.all(promesas);
                  queryClient.invalidateQueries(['misCartones']);
                  queryClient.invalidateQueries(['todosLosCartones']);
                  setDialogoPagoAbierto(false);
                  alert('Pago procesado exitosamente');
                }}
                className="w-full border-2 border-indigo-300 hover:bg-indigo-50 hover:border-indigo-600 rounded-lg p-4 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Pago en Línea</p>
                    <p className="text-xs text-slate-600">Tarjeta de crédito o débito</p>
                  </div>
                </div>
              </button>

              <button
                onClick={async () => {
                  // Marcar solo los cartones pendientes como pagados
                  const promesas = cartonesPendientes.map(carton => 
                    base44.entities.Carton.update(carton.id, { pagado: true })
                  );
                  await Promise.all(promesas);
                  queryClient.invalidateQueries(['misCartones']);
                  queryClient.invalidateQueries(['todosLosCartones']);
                  setDialogoPagoAbierto(false);
                  alert('Pago procesado exitosamente');
                }}
                className="w-full border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-600 rounded-lg p-4 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Billetera Virtual</p>
                    <p className="text-xs text-slate-600">Transferencia bancaria</p>
                  </div>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}