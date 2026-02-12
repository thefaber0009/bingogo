import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PlayCircle, 
  PauseCircle, 
  StopCircle,
  Users,
  Ticket,
  Circle,
  Zap,
  RotateCcw
} from 'lucide-react';

export default function PartidaEnVivo() {
  const [selectedPartidaId, setSelectedPartidaId] = useState('');
  const [autoSort, setAutoSort] = useState(false);
  const [tiempoSorteo, setTiempoSorteo] = useState(5);

  const { data: partidas = [] } = useQuery({
    queryKey: ['partidas'],
    queryFn: () => base44.entities.Partida.list(),
    refetchInterval: 2000,
  });

  const { data: cartones = [] } = useQuery({
    queryKey: ['cartones', selectedPartidaId],
    queryFn: () => base44.entities.Carton.filter({ partida_id: selectedPartidaId }),
    enabled: !!selectedPartidaId,
    refetchInterval: 2000,
  });

  const { data: bolas = [] } = useQuery({
    queryKey: ['bolas', selectedPartidaId],
    queryFn: () => base44.entities.BolaCantada.filter({ partida_id: selectedPartidaId }),
    enabled: !!selectedPartidaId,
    refetchInterval: 500,
  });

  React.useEffect(() => {
    if (!selectedPartidaId) return;
    const unsubscribe = base44.entities.BolaCantada.subscribe(() => {
      // Actualizar bolas cuando cambien
    });
    return unsubscribe;
  }, [selectedPartidaId]);

  const partidasActivas = partidas.filter(p => p.estado === 'en_curso' || p.estado === 'pendiente');
  const partidaActual = partidas.find(p => p.id === selectedPartidaId);

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Juego en Vivo</h1>
          <p className="text-slate-600 mt-2">Control y administración de partidas en tiempo real</p>
        </div>
        <Select value={selectedPartidaId} onValueChange={setSelectedPartidaId}>
          <SelectTrigger className="w-72 h-11 text-base">
            <SelectValue placeholder="Seleccionar partida" />
          </SelectTrigger>
          <SelectContent>
            {partidasActivas.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre} ({p.estado === 'en_curso' ? 'Activa' : 'Pendiente'})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedPartidaId ? (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlayCircle className="w-10 h-10 text-indigo-600" />
            </div>
            <p className="text-slate-700 font-semibold text-lg">Selecciona una partida</p>
            <p className="text-slate-500 text-sm mt-2">Elige una sala para comenzar a administrar el juego</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Controles - Sorteo Actual */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-xl">
              <CardTitle className="text-xl">SORTEO ACTUAL</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                   <div className="flex-1 min-w-48">
                     <label className="text-xs font-semibold text-slate-600 block mb-2">Modo automático</label>
                     <div className="flex items-center gap-3">
                       <span className="text-sm text-slate-700 font-medium">Intervalo:</span>
                       <select 
                         value={tiempoSorteo} 
                         onChange={(e) => setTiempoSorteo(parseInt(e.target.value))}
                         className="border border-slate-300 rounded px-3 py-2 text-sm"
                       >
                         <option value={3}>3 segundos</option>
                         <option value={5}>5 segundos</option>
                         <option value={10}>10 segundos</option>
                       </select>
                     </div>
                   </div>
                   <div className="flex items-end gap-2 flex-wrap">
                     <Button 
                       onClick={() => setAutoSort(true)}
                       disabled={autoSort || !selectedPartidaId}
                       className="bg-blue-600 hover:bg-blue-700 h-10"
                     >
                       Activar
                     </Button>
                     <Button 
                       onClick={() => setAutoSort(false)}
                       disabled={!autoSort}
                       className="bg-red-600 hover:bg-red-700 h-10"
                     >
                       Desactivar
                     </Button>
                   </div>
                 </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
                   <Button 
                     onClick={async () => {
                       if (!selectedPartidaId) return;
                       const disponibles = Array.from({length: 75}, (_, i) => i + 1)
                         .filter(n => !bolas.map(b => b.numero).includes(n));
                       if (disponibles.length > 0) {
                         const nuevoNumero = disponibles[Math.floor(Math.random() * disponibles.length)];
                         await base44.entities.BolaCantada.create({
                           partida_id: selectedPartidaId,
                           numero: nuevoNumero,
                           orden: bolas.length + 1
                         });
                       }
                     }}
                     disabled={!selectedPartidaId}
                     className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold h-10"
                   >
                     🎲 Sacar nuevo número
                   </Button>
                   <Button 
                     onClick={async () => {
                       if (!selectedPartidaId) return;
                       await Promise.all(bolas.map(b => base44.entities.BolaCantada.delete(b.id)));
                       setAutoSort(false);
                     }}
                     disabled={!selectedPartidaId || bolas.length === 0}
                     variant="outline" 
                     className="h-10"
                   >
                     <RotateCcw className="w-4 h-4 mr-2" />
                     Reiniciar
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Números Sorteados + Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bolas Cantadas */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-xl">
                  <CardTitle className="flex items-center justify-between">
                    <span>Números sorteados: {bolas.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {bolas.length > 0 ? (
                    <div className="grid grid-cols-10 gap-2">
                      {bolas.map((bola) => (
                        <div
                          key={bola.id}
                          className="aspect-square rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
                        >
                          {bola.numero}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-8">Sin números sorteados aún</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Jugadores + Info */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="w-5 h-5" />
                    Jugadores
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-indigo-600">{cartones.length}</div>
                  <p className="text-sm text-slate-600 mt-1">cartones activos</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Ticket className="w-5 h-5" />
                    Cartones
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-purple-600">{cartones.length}</div>
                  <p className="text-sm text-slate-600 mt-1">en juego</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Información del Juego */}
          {partidaActual && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-xl">
                <CardTitle className="text-xl">INFORMACIÓN DEL JUEGO</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</p>
                    <p className="text-lg font-bold text-slate-900 mt-2">{partidaActual.nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</p>
                    <p className={`text-lg font-bold mt-2 ${
                      partidaActual.estado === 'en_curso' ? 'text-green-600' :
                      partidaActual.estado === 'pendiente' ? 'text-amber-600' :
                      'text-slate-600'
                    }`}>
                      {partidaActual.estado === 'en_curso' ? 'Activa' : 
                       partidaActual.estado === 'pendiente' ? 'Pendiente' : 'Finalizada'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cartones</p>
                    <p className="text-lg font-bold text-slate-900 mt-2">{partidaActual.cantidad_total_cartones}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cartones Vendidos</p>
                    <p className="text-lg font-bold text-slate-900 mt-2">{partidaActual.cartones_vendidos || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Cartones */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-xl">
              <CardTitle className="text-xl">CARTONES EN JUEGO ({cartones.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {cartones.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-300">
                        <th className="text-left px-4 py-3 font-bold text-slate-900">ID</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-900">Jugador</th>
                        <th className="text-center px-4 py-3 font-bold text-slate-900">Estado</th>
                        <th className="text-center px-4 py-3 font-bold text-slate-900">Marcados</th>
                        <th className="text-center px-4 py-3 font-bold text-slate-900">Comprado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartones.map((carton, idx) => (
                        <tr key={carton.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium">#{idx + 1}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{carton.jugador_id?.substring(0, 8)}...</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              carton.estado === 'activo' ? 'bg-green-100 text-green-800' :
                              carton.estado === 'ganador' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {carton.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                            {carton.marcados?.length || 0} / 25
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              carton.comprado ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {carton.comprado ? 'Sí' : 'No'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No hay cartones en esta sala aún</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}