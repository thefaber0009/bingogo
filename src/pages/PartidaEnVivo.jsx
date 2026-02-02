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
  Circle
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Panel en Tiempo Real</h1>
          <p className="text-slate-600 mt-1">Monitorea y controla partidas en vivo</p>
        </div>
        <Select value={selectedPartidaId} onValueChange={setSelectedPartidaId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Seleccionar partida" />
          </SelectTrigger>
          <SelectContent>
            {partidasActivas.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre} - {p.estado}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedPartidaId ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <PlayCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Selecciona una partida para comenzar el monitoreo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controles */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Controles de Partida</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Iniciar
                  </Button>
                  <Button variant="outline">
                    <PauseCircle className="w-4 h-4 mr-2" />
                    Pausar
                  </Button>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    <StopCircle className="w-4 h-4 mr-2" />
                    Finalizar
                  </Button>
                </div>
              </CardContent>
            </Card>
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