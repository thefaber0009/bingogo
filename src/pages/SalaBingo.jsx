import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Circle,
  Trophy,
  Users,
  ArrowLeft,
  CheckCircle,
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
  Ticket
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CartonBingo from '../components/bingo/CartonBingo';

export default function SalaBingo() {
  const [marcados, setMarcados] = useState([]);
  const [autoMarcar, setAutoMarcar] = useState(true);
  const [modosGanados, setModosGanados] = useState([]);
  const [mostrarCompra, setMostrarCompra] = useState(false);
  const [paginaActual, setPaginaActual] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const cartonesPorPagina = 5;
  
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const partidaId = urlParams.get('partida');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partida } = useQuery({
    queryKey: ['partida', partidaId],
    queryFn: () => base44.entities.Partida.filter({ id: partidaId }).then(r => r[0]),
    enabled: !!partidaId,
  });

  const { data: cartones = [] } = useQuery({
    queryKey: ['misCartones', partidaId, user?.id],
    queryFn: () => base44.entities.Carton.filter({ 
      partida_id: partidaId,
      jugador_id: user.id 
    }),
    enabled: !!partidaId && !!user?.id,
    refetchInterval: 3000,
  });

  const { data: bolas = [] } = useQuery({
    queryKey: ['bolas', partidaId],
    queryFn: () => base44.entities.BolaCantada.filter({ partida_id: partidaId }, 'orden'),
    enabled: !!partidaId,
    refetchInterval: 2000,
  });

  const [cartonActivo, setCartonActivo] = useState(0);

  // Función para generar números aleatorios de bingo
  const generarCarton = () => {
    const carton = [];
    const rangos = [
      [1, 15],   // B
      [16, 30],  // I
      [31, 45],  // N
      [46, 60],  // G
      [61, 75]   // O
    ];

    for (let col = 0; col < 5; col++) {
      const columna = [];
      const [min, max] = rangos[col];
      const numerosDisponibles = Array.from({ length: max - min + 1 }, (_, i) => i + min);
      
      for (let row = 0; row < 5; row++) {
        if (col === 2 && row === 2) {
          columna.push(0); // Centro libre
        } else {
          const idx = Math.floor(Math.random() * numerosDisponibles.length);
          columna.push(numerosDisponibles.splice(idx, 1)[0]);
        }
      }
      carton.push(columna);
    }

    // Transponer para tener filas en lugar de columnas
    return carton[0].map((_, i) => carton.map(col => col[i]));
  };

  const crearCartonMutation = useMutation({
    mutationFn: async (cantidad) => {
      // Verificar límite de cartones por jugador
      if (cartones.length + cantidad > (partida?.max_cartones_por_jugador || 4)) {
        throw new Error(`No puedes comprar más de ${partida?.max_cartones_por_jugador} cartones`);
      }

      // Verificar disponibilidad total
      const cartonesVendidos = await base44.entities.Carton.filter({ 
        partida_id: partidaId, 
        comprado: true 
      });
      
      if (cartonesVendidos.length + cantidad > (partida?.cantidad_total_cartones || 0)) {
        throw new Error('No hay suficientes cartones disponibles');
      }

      const promesas = [];
      for (let i = 0; i < cantidad; i++) {
        const nuevoCarton = {
          jugador_id: user.id,
          partida_id: partidaId,
          numeros: generarCarton(),
          estado: 'activo',
          comprado: true,
          marcados: []
        };
        promesas.push(base44.entities.Carton.create(nuevoCarton));
      }
      const result = await Promise.all(promesas);

      // Actualizar contador de cartones vendidos
      await base44.entities.Partida.update(partidaId, {
        cartones_vendidos: cartonesVendidos.length + cantidad
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['misCartones', partidaId, user?.id]);
      queryClient.invalidateQueries(['partida', partidaId]);
      setMostrarCompra(false);
    },
    onError: (error) => {
      alert(error.message || 'Error al comprar cartones');
    }
  });

  const verificarModoJuego = (carton, tipo) => {
    if (!carton?.numeros || marcados.length < 5) return false;
    
    const numeros = carton.numeros;
    if (!Array.isArray(numeros[0])) return false;

    const esMarcado = (n) => n === 0 || marcados.includes(n);

    switch (tipo) {
      case 'linea_horizontal':
        return numeros.some(fila => fila.every(esMarcado));
      
      case 'linea_vertical':
        for (let col = 0; col < 5; col++) {
          if (numeros.every(fila => esMarcado(fila[col]))) return true;
        }
        return false;
      
      case 'diagonal':
        const diag1 = numeros.every((fila, i) => esMarcado(fila[i]));
        const diag2 = numeros.every((fila, i) => esMarcado(fila[4 - i]));
        return diag1 || diag2;
      
      case 'cuatro_esquinas':
        return esMarcado(numeros[0][0]) && esMarcado(numeros[0][4]) &&
               esMarcado(numeros[4][0]) && esMarcado(numeros[4][4]);
      
      case 'carton_lleno':
        return numeros.every(fila => fila.every(esMarcado));
      
      case 'cruz_pequena':
        return numeros[2].every(esMarcado) && 
               numeros.every(fila => esMarcado(fila[2]));
      
      case 'letra_x':
        return numeros.every((fila, i) => esMarcado(fila[i]) && esMarcado(fila[4 - i]));
      
      default:
        return false;
    }
  };

  // Auto-marcar números cuando salen bolas
  useEffect(() => {
    if (autoMarcar && bolas.length > 0) {
      const numerosBolas = bolas.map(b => b.numero);
      setMarcados(numerosBolas);
    }
  }, [bolas, autoMarcar]);

  // Verificar modos de juego ganados
  useEffect(() => {
    if (!partida?.modos_juego || cartones.length === 0 || marcados.length < 5) return;
    
    const modosActuales = [];
    
    for (const carton of cartones) {
      for (const modo of partida.modos_juego) {
        if (!modo.completado && verificarModoJuego(carton, modo.tipo)) {
          modosActuales.push({
            ...modo,
            carton_id: carton.id
          });
        }
      }
    }
    
    setModosGanados(modosActuales);
  }, [marcados, cartones, partida]);

  const handleMarcar = (numero) => {
    if (marcados.includes(numero)) {
      setMarcados(marcados.filter(n => n !== numero));
    } else {
      setMarcados([...marcados, numero]);
    }
  };

  const declararBingo = (modo) => {
    alert(`¡${modo.nombre}! Se notificará al administrador para validar tu victoria. Premio: $${modo.premio}`);
  };

  const comprarCartones = (cantidad) => {
    crearCartonMutation.mutate(cantidad);
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

  if (cartones.length === 0 && !mostrarCompra) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">No tienes cartones habilitados para esta partida</p>
            <Link to={createPageUrl('MisCartones') + `?partida=${partidaId}`}>
              <Button>Ver Mis Cartones</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filtrar cartones por búsqueda
  const cartonesFiltrados = cartones.filter((carton, idx) => {
    if (!busqueda) return true;
    const numeroCarton = (idx + 1).toString();
    return numeroCarton.includes(busqueda);
  });

  // Paginación
  const totalPaginas = Math.ceil(cartonesFiltrados.length / cartonesPorPagina);
  const cartonesEnPagina = cartonesFiltrados.slice(
    paginaActual * cartonesPorPagina,
    (paginaActual + 1) * cartonesPorPagina
  );

  if (cartones.length === 0 || mostrarCompra) {
    const combosRapidos = [3, 5, 7, 10].filter(c => c <= (partida?.max_cartones_por_jugador || 4));
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
        <Card className="max-w-4xl w-full border-0 shadow-xl">
          <CardContent className="py-12">
            <Trophy className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">{partida?.nombre}</h2>
            <p className="text-slate-600 mb-8 text-center">Selecciona cuántos cartones deseas comprar</p>
            
            {/* Combos Rápidos */}
            {combosRapidos.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-medium text-slate-700 mb-3 text-center">Combos Rápidos</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {combosRapidos.map((cantidad) => (
                    <Button
                      key={cantidad}
                      variant="outline"
                      size="lg"
                      onClick={() => comprarCartones(cantidad)}
                      disabled={crearCartonMutation.isLoading}
                      className="min-w-[100px]"
                    >
                      {cantidad} Cartones
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Compra individual */}
              <Card className="border-2 border-indigo-200 hover:border-indigo-400 transition-all cursor-pointer"
                    onClick={() => comprarCartones(1)}>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-slate-600 mb-2">1 Cartón</p>
                  <p className="text-3xl font-bold text-indigo-600 mb-2">
                    ${partida?.precio_carton?.toFixed(2)}
                  </p>
                  <Button disabled={crearCartonMutation.isLoading} className="w-full">
                    Comprar
                  </Button>
                </CardContent>
              </Card>

              {/* Combos */}
              {partida?.combos?.map((combo, idx) => (
                <Card key={idx} className="border-2 border-amber-200 hover:border-amber-400 transition-all cursor-pointer bg-amber-50"
                      onClick={() => comprarCartones(combo.cantidad)}>
                  <CardContent className="p-6 text-center relative">
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {combo.descuento}% OFF
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{combo.cantidad} Cartones</p>
                    <div className="mb-2">
                      <p className="text-lg text-slate-400 line-through">
                        ${(combo.cantidad * partida.precio_carton).toFixed(2)}
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        ${combo.precio?.toFixed(2)}
                      </p>
                    </div>
                    <Button disabled={crearCartonMutation.isLoading} className="w-full bg-amber-600 hover:bg-amber-700">
                      Comprar Combo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Link to={createPageUrl('Lobby')}>
                <Button variant="outline" size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Lobby
                </Button>
              </Link>
            </div>
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
            <Link to={createPageUrl('MisCartones') + `?partida=${partidaId}`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{partida?.nombre}</h1>
              <p className="text-slate-600">Sala de Bingo en Vivo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('MisCartones') + `?partida=${partidaId}`}>
              <Button variant="outline">
                <Ticket className="w-4 h-4 mr-2" />
                Mis Cartones ({cartones.length})
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setAutoMarcar(!autoMarcar)}
              className={autoMarcar ? 'bg-green-50 border-green-200' : ''}
            >
              <CheckCircle className={`w-4 h-4 mr-2 ${autoMarcar ? 'text-green-600' : ''}`} />
              {autoMarcar ? 'Auto' : 'Manual'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cartones */}
          <div className="lg:col-span-2 space-y-4">
            {/* Búsqueda y controles */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar cartón por número..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPaginaActual(0);
                  }}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-slate-600">
                {cartones.length} cartón{cartones.length !== 1 ? 'es' : ''}
              </div>
            </div>

            {/* Grid de Cartones */}
            <div className="grid grid-cols-1 gap-4">
              {cartonesEnPagina.map((carton, idx) => {
                const numeroCarton = cartonesFiltrados.indexOf(carton) + 1;
                return (
                  <div key={carton.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Cartón #{numeroCarton}</h3>
                    </div>
                    <CartonBingo 
                      carton={carton}
                      marcados={marcados}
                      onMarcar={handleMarcar}
                      autoMarcar={autoMarcar}
                    />
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPaginaActual(Math.max(0, paginaActual - 1))}
                  disabled={paginaActual === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPaginas }, (_, i) => (
                    <Button
                      key={i}
                      variant={paginaActual === i ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaginaActual(i)}
                      className="min-w-[40px]"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPaginaActual(Math.min(totalPaginas - 1, paginaActual + 1))}
                  disabled={paginaActual === totalPaginas - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {/* Modos Ganados */}
            {modosGanados.length > 0 && (
              <div className="space-y-2">
                {modosGanados.map((modo, idx) => (
                  <Card key={idx} className="border-0 shadow-xl bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse">
                    <CardContent className="p-6 text-center">
                      <Trophy className="w-12 h-12 text-white mx-auto mb-3" />
                      <h2 className="text-2xl font-bold text-white mb-2">¡{modo.nombre}!</h2>
                      <p className="text-white/90 mb-4">Premio: ${modo.premio}</p>
                      <Button 
                        size="lg"
                        onClick={() => declararBingo(modo)}
                        className="bg-white text-orange-600 hover:bg-slate-50"
                      >
                        Reclamar Premio
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Bolas Cantadas */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Circle className="w-5 h-5 text-indigo-600" />
                  Bolas Cantadas ({bolas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bolas.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
                      <p className="text-xs text-white/70 mb-1">Última bola</p>
                      <div className="flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                          <span className="text-3xl font-bold text-indigo-600">
                            {bolas[bolas.length - 1]?.numero}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {bolas.slice().reverse().map((bola, idx) => (
                          <div
                            key={bola.id}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              idx === 0 
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white scale-110 shadow-lg' 
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {bola.numero}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">
                    Esperando que comience el sorteo...
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Modos de Juego */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Modos de Juego
                </CardTitle>
              </CardHeader>
              <CardContent>
                {partida?.modos_juego?.length > 0 ? (
                  <div className="space-y-3">
                    {partida.modos_juego.map((modo, idx) => (
                      <div key={idx} className={`p-3 rounded-lg ${modo.completado ? 'bg-slate-100' : 'bg-gradient-to-r from-green-50 to-emerald-50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-900">{modo.nombre}</span>
                          {modo.completado && (
                            <span className="text-xs text-slate-500">✓ Completado</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600 capitalize">{modo.tipo.replace(/_/g, ' ')}</span>
                          <span className="text-lg font-bold text-green-600">${modo.premio}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center">No hay modos configurados</p>
                )}
              </CardContent>
            </Card>

            {/* Mis Cartones */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Mis Cartones</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {cartones.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Estado</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {partida?.estado}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}