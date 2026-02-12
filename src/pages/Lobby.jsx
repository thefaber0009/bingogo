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
  Zap,
  Menu,
  X,
  User,
  LogOut
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Lobby() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todas');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-sm sm:text-base">
              B
            </div>
            <span className="font-bold text-slate-900 text-sm sm:text-base hidden sm:inline">BingoGo</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to={createPageUrl('Home')} className="text-slate-700 hover:text-slate-900 font-medium text-sm">Inicio</Link>
            <Link to={createPageUrl('MisCartones')} className="text-slate-700 hover:text-slate-900 font-medium text-sm">Mis Cartones</Link>
            <Link to={createPageUrl('Home')} className="text-slate-700 hover:text-slate-900 font-medium text-sm">Histórico</Link>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 h-9">
              Usuario ↓
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 space-y-2 pb-3">
            <Link to={createPageUrl('MisCartones')} className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">
              🎫 Mis Cartones
            </Link>
            <Link to={createPageUrl('MisCartones')} className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">
              👤 Mi Perfil
            </Link>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Título */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Salas Disponibles</h1>
        </div>

        {/* Grid de Salas */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-600 mt-4">Cargando salas...</p>
          </div>
        ) : partidas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No hay salas disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {partidas.map((partida) => {
              const roomColor = getRoomColor(partida.nombre);
              const isActive = partida.estado === 'en_curso';
              
              return (
                <div key={partida.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-slate-200">
                  {/* Header con nombre y badge */}
                  <div className={`${roomColor.bg} text-white px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between rounded-t-xl`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👑</span>
                      <span className="font-bold capitalize text-sm sm:text-base">{partida.nombre}</span>
                    </div>
                    <span className={`text-white text-xs font-bold px-2.5 py-1 rounded-full ${isActive ? 'bg-green-600' : 'bg-slate-500'}`}>
                      {isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  {/* Imagen Bingo */}
                  <div className="h-40 sm:h-48 bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center border-b border-slate-200 overflow-hidden">
                    {partida.imagen_url ? (
                      <img src={partida.imagen_url} alt={partida.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <div className="text-5xl sm:text-6xl opacity-30">🎲🎰🎯</div>
                        <p className="text-slate-400 text-xs mt-2">Sala de Bingo</p>
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    {/* Stats */}
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <p>🎫 Cartones: <span className="font-bold text-slate-900">{partida.cantidad_total_cartones}</span></p>
                      <p>🏆 Premio: <span className="font-bold text-slate-900">${partida.modos_juego?.reduce((sum, m) => sum + (m.premio || 0), 0).toFixed(2) || '0.00'}</span></p>
                      <p>📅 Inicio: <span className="font-bold text-slate-900">{partida.fecha_inicio ? new Date(partida.fecha_inicio).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'}) + ' ' + new Date(partida.fecha_inicio).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span></p>
                      <p>⏱️ Duración: <span className="font-bold text-slate-900">30 min</span></p>
                      <p>💰 Precio: <span className="font-bold text-slate-900">${partida.precio_carton?.toFixed(2) || '0.00'}</span></p>
                    </div>

                    {/* Modos de juego */}
                    <div className="pt-1.5 border-t border-slate-200">
                      <p className="text-xs text-slate-700 font-semibold mb-1">🎮 Modos de Juego ({partida.modos_juego?.length || 0}):</p>
                      {partida.modos_juego && partida.modos_juego.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {partida.modos_juego.slice(0, 2).map((modo, idx) => (
                            <span key={idx} className="text-blue-600">
                              {modo.nombre} - ${modo.premio}
                            </span>
                          ))}
                          {partida.modos_juego.length > 2 && (
                            <span className="text-slate-500">
                              +{partida.modos_juego.length - 2} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Combos */}
                    <p className="text-xs text-slate-700">🎫 {partida.combos && partida.combos.length > 0 ? partida.combos.length : 0} combos disponibles</p>

                    {/* Botón */}
                    <Link to={createPageUrl('ComprarCartones') + `?partida=${partida.id}`} className="block pt-2">
                      <Button
                        className={`w-full font-bold py-2 h-9 sm:h-10 rounded-lg text-sm ${
                          isActive 
                            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                            : 'bg-slate-300 text-slate-600 cursor-not-allowed'
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