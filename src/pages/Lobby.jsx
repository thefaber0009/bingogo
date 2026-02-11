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

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Próximamente' },
      en_curso: { bg: 'bg-green-100', text: 'text-green-700', label: 'En Vivo' },
      finalizada: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Finalizada' },
    };
    const badge = badges[estado] || badges.pendiente;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

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
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Salas Disponibles</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')} className="text-slate-700 hover:text-slate-900 font-medium">Inicio</Link>
            <Link to={createPageUrl('MisCartones')} className="text-slate-700 hover:text-slate-900 font-medium">Mis Cartones</Link>
            <Link to={createPageUrl('Home')} className="text-slate-700 hover:text-slate-900 font-medium">Histórico</Link>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Usuario ↓
            </Button>
          </div>
        </div>

        {/* Lista de Partidas */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-600 mt-4">Cargando partidas...</p>
          </div>
        ) : filteredPartidas.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="py-20 text-center">
              <PlayCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No hay partidas disponibles</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredPartidas.map((partida) => (
              <Card key={partida.id} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Info Principal */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">{partida.nombre}</h3>
                          {getEstadoBadge(partida.estado)}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500 font-medium">Modos de Juego</p>
                          <p className="text-3xl font-bold text-green-600">
                            {partida.modos_juego?.length || 0}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Premio Total: ${partida.modos_juego?.reduce((sum, m) => sum + (m.premio || 0), 0).toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Fecha</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {partida.fecha_inicio ? new Date(partida.fecha_inicio).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Hora</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {partida.fecha_inicio ? new Date(partida.fecha_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Precio Cartón</p>
                            <p className="text-sm font-semibold text-slate-900">
                              ${partida.precio_carton?.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Total Cartones</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {partida.cantidad_total_cartones || 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Vendidos</p>
                            <p className="text-sm font-semibold text-green-700">
                              {getCartonesVendidos(partida.id)} / {partida.cantidad_total_cartones || 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Mis Cartones</p>
                            <p className="text-sm font-semibold text-indigo-600">
                              {getMisCartones(partida.id)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Combos disponibles */}
                      {partida.combos && partida.combos.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-xs text-slate-500 mb-2 font-medium">Combos Disponibles:</p>
                          <div className="flex gap-2 flex-wrap">
                            {partida.combos.map((combo, idx) => (
                              <div key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs">
                                <Tag className="w-3 h-3 text-amber-600" />
                                <span className="font-semibold">{combo.cantidad} cartones</span>
                                <span className="text-slate-600">por ${combo.precio?.toFixed(2)}</span>
                                <span className="text-red-600 font-semibold">({combo.descuento}% OFF)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Acción */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 flex items-center justify-center md:w-48">
                      <Link to={createPageUrl('ComprarCartones') + `?partida=${partida.id}`}>
                        <Button 
                          size="lg"
                          className="bg-white text-indigo-600 hover:bg-slate-50 shadow-lg"
                          disabled={partida.estado === 'finalizada'}
                        >
                          <PlayCircle className="w-5 h-5 mr-2" />
                          {partida.estado === 'en_curso' ? 'Jugar Ahora' : 'Unirse'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}