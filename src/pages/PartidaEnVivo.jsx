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

  const { data: partidas = [] } = useQuery({
    queryKey: ['partidas'],
    queryFn: () => base44.entities.Partida.list(),
  });

  const { data: cartones = [] } = useQuery({
    queryKey: ['cartones', selectedPartidaId],
    queryFn: () => base44.entities.Carton.filter({ partida_id: selectedPartidaId }),
    enabled: !!selectedPartidaId,
  });

  const { data: bolas = [] } = useQuery({
    queryKey: ['bolas', selectedPartidaId],
    queryFn: () => base44.entities.BolaCantada.filter({ partida_id: selectedPartidaId }, 'orden'),
    enabled: !!selectedPartidaId,
  });

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
                      <select className="border border-slate-300 rounded px-3 py-2 text-sm">
                        <option>3 segundos</option>
                        <option>5 segundos</option>
                        <option>10 segundos</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-end gap-2 flex-wrap">
                    <Button className="bg-blue-600 hover:bg-blue-700 h-10">
                      Activar
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-700 h-10">
                      Desactivar
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold h-10">
                    🎲 Sacar nuevo número
                  </Button>
                  <Button variant="outline" className="h-10">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reiniciar
                  </Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 h-10">
                    <Zap className="w-4 h-4 mr-2" />
                    Iniciar sorteo automático
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

          {/* Jugadores Conectados */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Jugadores Conectados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium">Total de jugadores</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {cartones.length}
                  </span>
                </div>
                <div className="text-sm text-slate-500 text-center py-4">
                  Monitoreo en tiempo real requiere WebSockets
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cartones Activos */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-purple-600" />
                Cartones Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium">Total de cartones</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {cartones.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Activos</span>
                  <span className="text-lg font-bold text-green-600">
                    {cartones.filter(c => c.estado === 'activo').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bolas Cantadas */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Circle className="w-5 h-5 text-blue-600" />
                Bolas Cantadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {bolas.length > 0 ? (
                  bolas.map((bola) => (
                    <div
                      key={bola.id}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg"
                    >
                      {bola.numero}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 w-full text-center py-4">
                    No hay bolas cantadas aún
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info de Partida */}
          {partidaActual && (
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
                <CardContent className="p-6">
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Nombre</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">{partidaActual.nombre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Estado</p>
                      <p className="text-lg font-bold text-slate-900 mt-1 capitalize">{partidaActual.estado}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Premio</p>
                      <p className="text-lg font-bold text-green-600 mt-1">${partidaActual.premio_total?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Entrada</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">${partidaActual.monto_entrada?.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}