import React from 'react';
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
  CheckCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function ComprarCartones() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const { data: cartonesVendidos = [] } = useQuery({
    queryKey: ['cartonesVendidos', partidaId],
    queryFn: () => base44.entities.Carton.filter({ 
      partida_id: partidaId,
      comprado: true
    }),
    enabled: !!partidaId,
  });

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

    return carton[0].map((_, i) => carton.map(col => col[i]));
  };

  const crearCartonMutation = useMutation({
    mutationFn: async (cantidad) => {
      if (misCartones.length + cantidad > (partida?.max_cartones_por_jugador || 4)) {
        throw new Error(`No puedes comprar más de ${partida?.max_cartones_por_jugador} cartones`);
      }

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

      await base44.entities.Partida.update(partidaId, {
        cartones_vendidos: cartonesVendidos.length + cantidad
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['misCartones', partidaId, user?.id]);
      queryClient.invalidateQueries(['partida', partidaId]);
      queryClient.invalidateQueries(['cartonesVendidos', partidaId]);
    },
    onError: (error) => {
      alert(error.message || 'Error al comprar cartones');
    }
  });

  const comprarYEntrar = async (cantidad) => {
    await crearCartonMutation.mutateAsync(cantidad);
    navigate(createPageUrl('MisCartones') + `?partida=${partidaId}`);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <Card className="max-w-5xl w-full border-0 shadow-2xl">
        <CardContent className="py-12 px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Trophy className="w-20 h-20 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{partida?.nombre}</h1>
            <p className="text-slate-600 text-lg">Compra tus cartones para participar</p>
          </div>

          {/* Información de la partida */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
              <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-slate-600 mb-1">Precio por Cartón</p>
              <p className="text-2xl font-bold text-blue-700">${partida?.precio_carton?.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
              <Ticket className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-slate-600 mb-1">Disponibles</p>
              <p className="text-2xl font-bold text-green-700">{cartonesDisponibles}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 text-center">
              <Ticket className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-xs text-slate-600 mb-1">Mis Cartones</p>
              <p className="text-2xl font-bold text-indigo-700">{misCartones.length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
              <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-xs text-slate-600 mb-1">Modos de Juego</p>
              <p className="text-2xl font-bold text-purple-700">{partida?.modos_juego?.length || 0}</p>
            </div>
          </div>

          {/* Si ya tiene cartones */}
          {misCartones.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-700 font-semibold">Ya tienes {misCartones.length} cartón{misCartones.length !== 1 ? 'es' : ''} comprado{misCartones.length !== 1 ? 's' : ''}</p>
              <Button 
                onClick={entrarAPanelCartones}
                className="mt-3 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Ver Mis Cartones
              </Button>
            </div>
          )}

          {/* Combos Rápidos */}
          {puedeComprar && combosRapidos.length > 0 && (
            <div className="mb-8">
              <p className="text-sm font-semibold text-slate-700 mb-4 text-center">⚡ Compra Rápida</p>
              <div className="flex gap-3 justify-center flex-wrap">
                {combosRapidos.map((cantidad) => (
                  <Button
                    key={cantidad}
                    variant="outline"
                    size="lg"
                    onClick={() => comprarYEntrar(cantidad)}
                    disabled={crearCartonMutation.isLoading}
                    className="min-w-[120px] border-2 hover:border-indigo-500 hover:bg-indigo-50"
                  >
                    {cantidad} Cartones
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Opciones de compra */}
          {puedeComprar && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-4 text-center">Selecciona tu opción</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Compra individual */}
                <Card className="border-2 border-indigo-200 hover:border-indigo-400 transition-all cursor-pointer hover:shadow-xl"
                      onClick={() => comprarYEntrar(1)}>
                  <CardContent className="p-6 text-center">
                    <Ticket className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 mb-2">1 Cartón</p>
                    <p className="text-4xl font-bold text-indigo-600 mb-4">
                      ${partida?.precio_carton?.toFixed(2)}
                    </p>
                    <Button 
                      disabled={crearCartonMutation.isLoading} 
                      className="w-full"
                    >
                      Comprar e Ingresar
                    </Button>
                  </CardContent>
                </Card>

                {/* Combos */}
                {partida?.combos?.filter(combo => combo.cantidad <= (partida?.max_cartones_por_jugador || 4) - misCartones.length).map((combo, idx) => (
                  <Card key={idx} className="border-2 border-amber-200 hover:border-amber-400 transition-all cursor-pointer bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-xl"
                        onClick={() => comprarYEntrar(combo.cantidad)}>
                    <CardContent className="p-6 text-center relative">
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                        {combo.descuento}% OFF
                      </div>
                      <Tag className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 mb-2">{combo.cantidad} Cartones</p>
                      <div className="mb-4">
                        <p className="text-lg text-slate-400 line-through">
                          ${(combo.cantidad * partida.precio_carton).toFixed(2)}
                        </p>
                        <p className="text-4xl font-bold text-green-600">
                          ${combo.precio?.toFixed(2)}
                        </p>
                        <p className="text-xs text-green-600 font-semibold mt-1">
                          Ahorras ${((combo.cantidad * partida.precio_carton) - combo.precio).toFixed(2)}
                        </p>
                      </div>
                      <Button 
                        disabled={crearCartonMutation.isLoading} 
                        className="w-full bg-amber-600 hover:bg-amber-700"
                      >
                        Comprar e Ingresar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!puedeComprar && misCartones.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">No hay cartones disponibles</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-4 justify-center">
            <Link to={createPageUrl('Lobby')}>
              <Button variant="outline" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Lobby
              </Button>
            </Link>
            {misCartones.length > 0 && (
              <Button 
                onClick={entrarAPanelCartones}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Ver Mis Cartones
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}