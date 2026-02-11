import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  PlayCircle, 
  Users, 
  DollarSign,
  Trophy,
  Calendar,
  Clock,
  Search,
  Filter,
  Ticket,
  Tag,
  Zap
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Lobby() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todas');
  
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partidas = [], isLoading } = useQuery({
    queryKey: ['partidas-lobby'],
    queryFn: () => base44.entities.Partida.list('-fecha_inicio'),
    refetchInterval: 5000,
  });

  const { data: cartones = [] } = useQuery({
    queryKey: ['cartones-lobby'],
    queryFn: () => base44.entities.Carton.list(),
    refetchInterval: 5000,
  });

  const getCartonesDisponibles = (partidaId) => {
    const cartonesPartida = cartones.filter(c => c.partida_id === partidaId);
    const cartonesComprados = cartonesPartida.filter(c => c.comprado).length;
    return cartonesPartida.length - cartonesComprados;
  };

  const getCartonesVendidos = (partidaId) => {
    return cartones.filter(c => c.partida_id === partidaId && c.comprado).length;
  };

  const getMisCartones = (partidaId) => {
    if (!user) return 0;
    return cartones.filter(c => c.partida_id === partidaId && c.jugador_id === user.id && c.comprado).length;
  };

  const filteredPartidas = partidas.filter(p => {
    const matchSearch = p.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filterEstado === 'todas' || p.estado === filterEstado;
    return matchSearch && matchEstado;
  });



  const roomColors = {
    festivo: { bg: 'bg-yellow-400', badge: 'bg-yellow-400' },
    diamante: { bg: 'bg-purple-500', badge: 'bg-purple-500' },
    star: { bg: 'bg-purple-500', badge: 'bg-purple-500' },
    default: { bg: 'bg-indigo-500', badge: 'bg-indigo-500' }
  };

  const getRoomColor = (nombre) => {
    const lower = nombre?.toLowerCase() || '';
    if (lower.includes('festivo')) return roomColors.festivo;
    if (lower.includes('diamante')) return roomColors.diamante;
    if (lower.includes('star')) return roomColors.star;
    return roomColors.default;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center font-bold text-white">
              B
            </div>
            <span className="font-bold text-slate-900">BingoGo</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to={createPageUrl('Home')} className="text-slate-700 hover:text-slate-900 font-medium text-sm">Inicio</Link>
            <Link to={createPageUrl('MisCartones')} className="text-slate-700 hover:text-slate-900 font-medium text-sm">Mis Cartones</Link>
            <Link to={createPageUrl('Home')} className="text-slate-700 hover:text-slate-900 font-medium text-sm">Histórico</Link>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 h-9">
              Usuario ↓
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Título */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Salas Disponibles</h1>
        </div>

        {/* Grid de Salas */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-600 mt-4">Cargando salas...</p>
          </div>
        ) : partidas.length === 0 ? (
          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="py-20 text-center">
              <PlayCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No hay salas disponibles</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partidas.map((partida) => {
              const roomColor = getRoomColor(partida.nombre);
              const isActive = partida.estado === 'en_curso';
              
              return (
                <div key={partida.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                  {/* Header con Badge */}
                  <div className={`${roomColor.bg} text-white p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      <span className="font-bold text-lg capitalize">{partida.nombre}</span>
                    </div>
                    <span className={`${isActive ? 'bg-green-500' : 'bg-slate-400'} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                      {isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  {/* Imagen/Placeholder */}
                  <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <div className="text-center">
                      <Zap className="w-16 h-16 text-slate-500 mx-auto mb-2 opacity-50" />
                      <p className="text-slate-600 font-semibold">Sala de Bingo</p>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6 space-y-4">
                    {/* Stats principales */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-4 h-4 flex items-center justify-center text-xs">🎫</span>
                        <span className="text-slate-700">Cartones: <span className="font-bold">{partida.cantidad_total_cartones}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-4 h-4 flex items-center justify-center text-xs">🏆</span>
                        <span className="text-slate-700">Premio: <span className="font-bold">${partida.modos_juego?.reduce((sum, m) => sum + (m.premio || 0), 0).toFixed(2) || '0.00'}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-4 h-4 flex items-center justify-center text-xs">📅</span>
                        <span className="text-slate-700">Inicio: <span className="font-bold">{partida.fecha_inicio ? new Date(partida.fecha_inicio).toLocaleString('es-ES', {month: 'numeric', day: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit'}) : 'N/A'}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-4 h-4 flex items-center justify-center text-xs">⏱️</span>
                        <span className="text-slate-700">Duración: <span className="font-bold">30 min</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-4 h-4 flex items-center justify-center text-xs">🎮</span>
                        <span className="text-slate-700">Modos de Juego: <span className="font-bold">({partida.modos_juego?.length || 0})</span></span>
                      </div>
                    </div>

                    {/* Combos */}
                    {partida.combos && partida.combos.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-600 font-semibold mb-2">Combos:</p>
                        <div className="space-y-1">
                          {partida.combos.slice(0, 3).map((combo, idx) => (
                            <div key={idx} className="text-xs text-slate-700">
                              <span className="font-semibold">{combo.cantidad} cartones</span> ${combo.precio?.toFixed(2)} | <span className="text-green-600">{combo.descuento}% OFF</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botón */}
                    <Link to={createPageUrl('ComprarCartones') + `?partida=${partida.id}`} className="block">
                      <Button
                        className={`w-full font-bold py-2 ${
                          isActive 
                            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                            : 'bg-slate-300 hover:bg-slate-400 text-slate-700'
                        }`}
                        disabled={!isActive}
                      >
                        {isActive ? 'Jugar' : 'No Disponible'}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}