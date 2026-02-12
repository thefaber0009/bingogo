import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Trophy,
  ArrowLeft,
  Ticket,
  DollarSign,
  Tag,
  CheckCircle,
  Users,
  Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

// Generador de números pseudoaleatorios determinista (fuera del componente)
const seededRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
};

// Generar cartón determinista basado en número de cartón (fuera del componente)
const generarCartonDeterminista = (numeroCarton) => {
  const random = seededRandom(numeroCarton * 9999);
  const rangos = [
    [1, 15],   // B
    [16, 30],  // I
    [31, 45],  // N
    [46, 60],  // G
    [61, 75]   // O
  ];

  const carton = [];
  const numerosUsadosPorColumna = [[], [], [], [], []];

  for (let row = 0; row < 5; row++) {
    const fila = [];
    for (let col = 0; col < 5; col++) {
      if (col === 2 && row === 2) {
        fila.push(0); // Centro libre
      } else {
        const [min, max] = rangos[col];
        const numerosDisponibles = Array.from(
          { length: max - min + 1 },
          (_, i) => i + min
        ).filter(n => !numerosUsadosPorColumna[col].includes(n));

        const num = numerosDisponibles[Math.floor(random() * numerosDisponibles.length)];
        numerosUsadosPorColumna[col].push(num);
        fila.push(num);
      }
    }
    carton.push(fila);
  }

  return carton;
};

export default function ComprarCartones() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cartonesSeleccionados, setCartonesSeleccionados] = useState([]);
  const [filtroCartones, setFiltroCartones] = useState('disponibles');
  const [paginaActual, setPaginaActual] = useState(1);
  const [busquedaNumero, setBusquedaNumero] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const CARTONES_POR_PAGINA = isMobile ? 5 : 25;

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const urlParams = new URLSearchParams(window.location.search);
  const partidaId = urlParams.get('partida');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partida, isLoading } = useQuery({
    queryKey: ['partida', partidaId],
    queryFn: () => base44.entities.Partida.filter({ id: partidaId }).then(r => r[0]),
    enabled: !!partidaId,
  });

  const { data: misCartones = [] } = useQuery({
    queryKey: ['misCartones', partidaId, user?.id],
    queryFn: () => base44.entities.Carton.filter({ 
      partida_id: partidaId,
      jugador_id: user.id,
      comprado: true
    }),
    enabled: !!partidaId && !!user?.id,
  });

  const { data: todosLosCartones = [], isLoading: loadingCartones } = useQuery({
    queryKey: ['todosLosCartones', partidaId],
    queryFn: async () => {
      const cartones = await base44.entities.Carton.filter({ 
        partida_id: partidaId
      });
      console.log('Cartones encontrados:', cartones.length, 'para partida:', partidaId);
      console.log('Cartones:', cartones);
      return cartones;
    },
    enabled: !!partidaId,
    refetchInterval: 3000,
    staleTime: 0,
  });

  const cartonesVendidos = todosLosCartones.filter(c => c.comprado);
  const cartonesDisponiblesDB = todosLosCartones.filter(c => !c.comprado);



  const cartonesDisponiblesParaComprar = useMemo(() => {
    return cartonesDisponiblesDB.map(c => ({
      id: c.id,
      numeroVirtual: c.numero_carton,
      numeros: c.numeros,
      comprado: false
    }));
  }, [cartonesDisponiblesDB]);



  const crearCartonMutation = useMutation({
    mutationFn: async (cartonesVirtuales) => {
      if (misCartones.length + cartonesVirtuales.length > (partida?.max_cartones_por_jugador || 4)) {
        throw new Error(`No puedes comprar más de ${partida?.max_cartones_por_jugador} cartones`);
      }

      if (cartonesVendidos.length + cartonesVirtuales.length > (partida?.cantidad_total_cartones || 0)) {
        throw new Error('No hay suficientes cartones disponibles');
      }

      // Actualizar los cartones existentes en lugar de crear nuevos
      const promesas = [];
      for (const cartonVirtual of cartonesVirtuales) {
        promesas.push(
          base44.entities.Carton.update(cartonVirtual.id, {
            jugador_id: user.id,
            comprado: true,
            pagado: false
          })
        );
      }
      const result = await Promise.all(promesas);

      await base44.entities.Partida.update(partidaId, {
        cartones_vendidos: cartonesVendidos.length + cartonesVirtuales.length
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['misCartones', partidaId, user?.id]);
      queryClient.invalidateQueries(['partida', partidaId]);
      queryClient.invalidateQueries(['todosLosCartones', partidaId]);
    },
    onError: (error) => {
      alert(error.message || 'Error al comprar cartones');
    }
  });

  const comprarYEntrar = async (cantidad) => {
    const cartonesAComprar = cartonesDisponiblesParaComprar.slice(0, cantidad);
    await crearCartonMutation.mutateAsync(cartonesAComprar);
    navigate(createPageUrl('MisCartones') + `?partida=${partidaId}`);
  };

  const handleComprarSeleccionados = async () => {
    if (cartonesSeleccionados.length > 0) {
      const cartonesAComprar = cartonesDisponiblesParaComprar.filter(c => cartonesSeleccionados.includes(c.id));
      await crearCartonMutation.mutateAsync(cartonesAComprar);
      navigate(createPageUrl('MisCartones') + `?partida=${partidaId}`);
    }
  };

  const toggleCartonSeleccionado = (cartonId) => {
    setCartonesSeleccionados(prev =>
      prev.includes(cartonId) 
        ? prev.filter(id => id !== cartonId)
        : [...prev, cartonId]
    );
  };

  const entrarAPanelCartones = () => {
    navigate(createPageUrl('MisCartones') + `?partida=${partidaId}`);
  };

  if (!partidaId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">No se especificó una partida</p>
            <Link to={createPageUrl('Lobby')}>
              <Button className="mt-4">Volver al Lobby</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  const cartonesDisponibles = (partida?.cantidad_total_cartones || 0) - cartonesVendidos.length;
  const puedeComprar = misCartones.length < (partida?.max_cartones_por_jugador || 4);
  const combosRapidos = [3, 5, 7, 10].filter(c => 
    c <= (partida?.max_cartones_por_jugador || 4) - misCartones.length
  );

  const cartonesTodosConFiltro = cartonesDisponiblesParaComprar.filter(c => {
    let cumpleFiltro = true;
    if (filtroCartones === 'seleccionados') {
      cumpleFiltro = cartonesSeleccionados.includes(c.id);
    } else if (filtroCartones === 'disponibles') {
      cumpleFiltro = true; // Todos los cartones mostrados son disponibles
    } else if (filtroCartones === 'vendidos') {
      cumpleFiltro = false; // No mostrar vendidos en esta vista
    }

    if (busquedaNumero) {
      const numBuscado = parseInt(busquedaNumero);
      if (!isNaN(numBuscado)) {
        cumpleFiltro = cumpleFiltro && c.numeros?.flat?.().includes(numBuscado);
      }
    }
    return cumpleFiltro;
  });

  const totalPaginas = Math.ceil(cartonesTodosConFiltro.length / CARTONES_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * CARTONES_POR_PAGINA;
  const cartonesParaMostrar = cartonesTodosConFiltro.slice(indiceInicio, indiceInicio + CARTONES_POR_PAGINA);

  const precioSeleccionados = cartonesSeleccionados.length * (partida?.precio_carton || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-500 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${partida?.estado === 'en_curso' ? 'bg-green-500' : 'bg-slate-400'}`}>
              ◆
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{partida?.nombre}</h1>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${partida?.estado === 'en_curso' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                  {partida?.estado === 'en_curso' ? '● Activa' : '● Inactiva'}
                </span>
                <span className="text-xs text-slate-500">ID: {partidaId}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Lobby')}>
              <Button variant="outline" className="border-slate-300">← Volver</Button>
            </Link>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">🔄 Actualizar</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-blue-600 font-bold text-lg">🎫</p>
            <p className="text-2xl font-bold text-slate-900">{partida?.cantidad_total_cartones}</p>
            <p className="text-xs text-slate-500">Cartones totales</p>
          </div>
          <div className="text-center">
            <p className="text-green-600 font-bold text-lg">🏆</p>
            <p className="text-2xl font-bold text-slate-900">${partida?.modos_juego?.reduce((sum, m) => sum + (m.premio || 0), 0).toFixed(2) || '0'}</p>
            <p className="text-xs text-slate-500">Premio</p>
          </div>
          <div className="text-center">
            <p className="text-purple-600 font-bold text-lg">👥</p>
            <p className="text-2xl font-bold text-slate-900">{cartonesVendidos.length}</p>
            <p className="text-xs text-slate-500">Jugadores</p>
          </div>
          <div className="text-center">
            <p className="text-slate-600 font-bold text-lg">⏱️</p>
            <p className="text-2xl font-bold text-slate-900">29:54</p>
            <p className="text-xs text-slate-500">Tiempo</p>
          </div>
        </div>

        {/* Modos de Juego */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">🎮 Modos de Juego</h3>
          <div className="flex flex-wrap gap-3">
            {partida?.modos_juego?.map((modo, idx) => (
              <span key={idx} className="bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full text-sm font-semibold">
                {modo.nombre} - ${modo.premio}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Combos */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-slate-900 mb-4">💚 Combos Disponibles</h3>
              <div className="space-y-3">
                {partida?.combos?.map((combo, idx) => (
                  <div key={idx} className="bg-purple-500 text-white rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{combo.cantidad > 5 ? `Combo ${idx > 0 ? 'Premium' : 'Básico'}` : 'Combo Básico'}</p>
                      <p className="text-sm opacity-90">{combo.cantidad} cartones por ${combo.precio}</p>
                      <p className="text-xs opacity-75">Precio por cartón: ${(combo.precio / combo.cantidad).toFixed(2)}</p>
                    </div>
                    <span className="bg-yellow-400 text-purple-900 font-bold px-3 py-1 rounded-lg text-sm">
                      ¡Ahorra {combo.descuento}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtro y Búsqueda */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <h3 className="font-bold text-slate-900 mb-4">▼ Filtrar Cartones</h3>
              <div className="flex gap-2 flex-wrap">
                {['disponibles', 'vendidos', 'seleccionados'].map((filtro) => (
                  <button
                    key={filtro}
                    onClick={() => { setFiltroCartones(filtro); setPaginaActual(1); }}
                    className={`px-4 py-2 rounded-full font-bold text-sm capitalize transition-all ${
                      filtroCartones === filtro
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {filtro === 'disponibles' ? `Disponibles (${cartonesDisponiblesParaComprar.length})` :
                     filtro === 'vendidos' ? `Vendidos (${cartonesVendidos.length})` :
                     'Seleccionados'}
                  </button>
                ))}
              </div>
              
              <div>
                <label className="text-xs text-slate-600 font-bold">🔍 Buscar por número</label>
                <input
                  type="number"
                  min="1"
                  max="75"
                  placeholder="Ej: 15"
                  value={busquedaNumero}
                  onChange={(e) => { setBusquedaNumero(e.target.value); setPaginaActual(1); }}
                  className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Selector de Cartones */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">⊞ Seleccionar Cartones ({cartonesTodosConFiltro.length} disponibles)</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCartonesSeleccionados([...cartonesSeleccionados, ...cartonesParaMostrar.map(c => c.id).filter(id => !cartonesSeleccionados.includes(id))])}
                    className="text-xs font-bold px-3 py-1 bg-blue-400 text-white rounded"
                  >
                    ✓ Todos
                  </button>
                  <button 
                    onClick={() => setCartonesSeleccionados([])}
                    className="text-xs font-bold px-3 py-1 bg-orange-400 text-white rounded"
                  >
                    🔥 Limpiar
                  </button>
                </div>
              </div>
              
              {loadingCartones && cartonesParaMostrar.length === 0 ? (
                <div className="col-span-5 text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                  <p className="text-slate-600">Cargando cartones...</p>
                </div>
              ) : cartonesParaMostrar.length === 0 ? (
                <div className="col-span-5 text-center py-12">
                  <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No hay cartones disponibles</p>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {cartonesParaMostrar.map((carton) => {
                  return (
                    <div
                      key={carton.id}
                      onClick={() => toggleCartonSeleccionado(carton.id)}
                      className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all ${
                        cartonesSeleccionados.includes(carton.id)
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {cartonesSeleccionados.includes(carton.id) && (
                        <div className="absolute -top-3 -right-3 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                          ✓
                        </div>
                      )}
                      <div className="bg-blue-100 rounded p-1 mb-2">
                        <p className="font-bold text-blue-700 text-center text-xs">BINGO MANÍA</p>
                      </div>
                      <p className="text-red-600 font-bold text-xs text-center mb-2">Cartón No. {carton.numeroVirtual}</p>
                      <div className="grid grid-cols-5 gap-0.5 text-center text-xs mb-1">
                        <div className="font-bold text-slate-600">B</div>
                        <div className="font-bold text-slate-600">I</div>
                        <div className="font-bold text-slate-600">N</div>
                        <div className="font-bold text-slate-600">G</div>
                        <div className="font-bold text-slate-600">O</div>
                      </div>
                      <div className="grid grid-cols-5 gap-0.5 text-center text-xs">
                        {carton.numeros?.map((fila, row) =>
                          fila.map((num, col) => (
                            <div key={`${row}-${col}`} className={`${num === 0 ? 'bg-yellow-300' : 'bg-slate-100'} rounded p-0.5 font-semibold text-slate-700 text-xs`}>
                              {num === 0 ? '✓' : num}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              )}

              {/* Paginación Mejorada */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setPaginaActual(1)}
                    disabled={paginaActual === 1}
                    className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                      paginaActual === 1
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    ⟨⟨
                  </button>
                  <button
                    onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                    disabled={paginaActual === 1}
                    className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                      paginaActual === 1
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    ⟨
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({length: totalPaginas}, (_, i) => i + 1).map((page) => {
                      if (totalPaginas <= 7 || Math.abs(page - paginaActual) <= 2 || page === 1 || page === totalPaginas) {
                        return (
                          <button
                            key={page}
                            onClick={() => setPaginaActual(page)}
                            className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                              paginaActual === page
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (Math.abs(page - paginaActual) === 3) {
                        return <span key={page} className="text-slate-500">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                    disabled={paginaActual === totalPaginas}
                    className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                      paginaActual === totalPaginas
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    ⟩
                  </button>
                  <button
                    onClick={() => setPaginaActual(totalPaginas)}
                    disabled={paginaActual === totalPaginas}
                    className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                      paginaActual === totalPaginas
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    ⟩⟩
                  </button>

                  <div className="text-slate-600 font-bold text-sm">
                    Página {paginaActual} de {totalPaginas}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Resumen */}
          <div className="bg-white rounded-2xl shadow-lg p-6 h-fit sticky top-6">
            <h3 className="font-bold text-slate-900 mb-6">🛒 Resumen de Compra</h3>
            
            <div className="bg-purple-600 text-white rounded-xl p-6 text-center mb-4">
              <p className="text-4xl font-bold">{cartonesSeleccionados.length}</p>
              <p className="text-sm opacity-90">Cartones seleccionados</p>
            </div>

            <Button className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold mb-4 py-3">
              🧹 Limpiar Selección
            </Button>

            <div className="space-y-3 border-t border-slate-200 pt-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">Cartones individuales:</span>
                <span className="font-bold">${(cartonesSeleccionados.length * (partida?.precio_carton || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">Descuento combo:</span>
                <span className="font-bold">$0</span>
              </div>
            </div>

            <div className="bg-slate-100 rounded-lg p-3 mb-6 text-center">
              <p className="text-xs text-slate-600 mb-1">Total a pagar:</p>
              <p className="text-2xl font-bold text-slate-900">${precioSeleccionados.toFixed(2)}</p>
            </div>

            <Button 
              onClick={handleComprarSeleccionados}
              disabled={cartonesSeleccionados.length === 0 || crearCartonMutation.isLoading}
              className={`w-full font-bold py-3 h-11 rounded-lg ${
                cartonesSeleccionados.length > 0
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-slate-300 text-slate-600 cursor-not-allowed'
              }`}
            >
              {cartonesSeleccionados.length > 0 ? `🛒 Comprar ${cartonesSeleccionados.length} Cartones` : 'Comprar'}
            </Button>

            <p className="text-xs text-slate-500 text-center mt-4">
              🔔 Los cartones se reservan por 5 minutos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}