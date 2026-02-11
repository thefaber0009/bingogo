import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  Users,
  PlayCircle,
  CheckCircle,
  Clock,
  Ticket,
  Trophy
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import ModosJuegoForm from '../components/partidas/ModosJuegoForm';
import CombosForm from '../components/partidas/CombosForm';
import CreateRoomDialog from '../components/partidas/CreateRoomDialog';

export default function Partidas() {
  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartida, setEditingPartida] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todas');
  const [formData, setFormData] = useState({
    nombre: '',
    fecha_inicio: '',
    precio_carton: '',
    cantidad_total_cartones: '',
    max_cartones_por_jugador: 4,
    max_jugadores: '',
    modos_juego: [],
    combos: [],
  });

  const queryClient = useQueryClient();

  const { data: partidas = [], isLoading } = useQuery({
    queryKey: ['partidas'],
    queryFn: () => base44.entities.Partida.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Partida.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['partidas']);
      setOpen(false);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: (data) => base44.entities.Partida.create({
      ...data,
      estado: 'pendiente',
      cartones_vendidos: 0,
      max_cartones_por_jugador: 4
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['partidas']);
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Partida.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['partidas']);
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Partida.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['partidas']);
    },
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      fecha_inicio: '',
      precio_carton: '',
      cantidad_total_cartones: '',
      max_cartones_por_jugador: 4,
      max_jugadores: '',
      modos_juego: [],
      combos: [],
    });
    setEditingPartida(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      precio_carton: parseFloat(formData.precio_carton),
      cantidad_total_cartones: parseInt(formData.cantidad_total_cartones),
      max_cartones_por_jugador: parseInt(formData.max_cartones_por_jugador),
      max_jugadores: parseInt(formData.max_jugadores) || null,
    };

    if (editingPartida) {
      updateMutation.mutate({ id: editingPartida.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (partida) => {
    setEditingPartida(partida);
    setFormData({
      nombre: partida.nombre,
      fecha_inicio: partida.fecha_inicio?.split('T')[0] || '',
      precio_carton: partida.precio_carton?.toString() || '',
      cantidad_total_cartones: partida.cantidad_total_cartones?.toString() || '',
      max_cartones_por_jugador: partida.max_cartones_por_jugador || 4,
      max_jugadores: partida.max_jugadores?.toString() || '',
      modos_juego: partida.modos_juego || [],
      combos: partida.combos || [],
    });
    setOpen(true);
  };

  const handleCreateRoom = async (data) => {
    await createRoomMutation.mutateAsync(data);
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
      en_curso: { bg: 'bg-green-100', text: 'text-green-700', icon: PlayCircle },
      finalizada: { bg: 'bg-slate-100', text: 'text-slate-700', icon: CheckCircle },
    };
    const badge = badges[estado] || badges.pendiente;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {estado}
      </span>
    );
  };

  const filteredPartidas = partidas.filter(p => {
    const matchSearch = p.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filterEstado === 'todas' || p.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Salas de Bingo</h1>
          <p className="text-slate-600 mt-1">Administra todas las salas de juego</p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Sala
        </Button>
      </div>

      {/* Dialog de Crear Sala */}
      <CreateRoomDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateRoom}
        isLoading={createRoomMutation.isLoading}
      />

      {/* Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar sala..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['todas', 'pendiente', 'en_curso', 'finalizada'].map(status => (
            <Button
              key={status}
              variant={filterEstado === status ? 'default' : 'outline'}
              onClick={() => setFilterEstado(status)}
              className={filterEstado === status ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : ''}
            >
              {status === 'todas' ? 'Todas' : status === 'pendiente' ? 'Próximamente' : status === 'en_curso' ? 'En Vivo' : 'Finalizada'}
            </Button>
          ))}
        </div>
      </div>

      {/* Dialog antiguo para editar */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPartida ? 'Editar Partida' : 'Nueva Partida'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="nombre">Nombre de la Partida</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
                <Input
                  id="fecha_inicio"
                  type="datetime-local"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio_carton">Precio por Cartón ($)</Label>
                <Input
                  id="precio_carton"
                  type="number"
                  step="0.01"
                  value={formData.precio_carton}
                  onChange={(e) => setFormData({ ...formData, precio_carton: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad_total_cartones">Cantidad Total de Cartones</Label>
                <Input
                  id="cantidad_total_cartones"
                  type="number"
                  min="1"
                  value={formData.cantidad_total_cartones}
                  onChange={(e) => setFormData({ ...formData, cantidad_total_cartones: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_cartones_por_jugador">Cartones Máximos por Jugador</Label>
                <Input
                  id="max_cartones_por_jugador"
                  type="number"
                  min="1"
                  value={formData.max_cartones_por_jugador}
                  onChange={(e) => setFormData({ ...formData, max_cartones_por_jugador: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_jugadores">Máximo de Jugadores</Label>
                <Input
                  id="max_jugadores"
                  type="number"
                  value={formData.max_jugadores}
                  onChange={(e) => setFormData({ ...formData, max_jugadores: e.target.value })}
                />
              </div>
            </div>

            <ModosJuegoForm 
              modos={formData.modos_juego}
              onChange={(modos) => setFormData({ ...formData, modos_juego: modos })}
            />

            <CombosForm 
              combos={formData.combos}
              precioCarton={parseFloat(formData.precio_carton) || 0}
              onChange={(combos) => setFormData({ ...formData, combos: combos })}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600">
                {editingPartida ? 'Actualizar' : 'Crear'} Partida
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPartidas.length === 0 ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="py-20 text-center">
                <PlayCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No hay salas disponibles</p>
              </CardContent>
            </Card>
          ) : (
            filteredPartidas.map((partida) => (
            <Card key={partida.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-slate-900">{partida.nombre}</h3>
                      {getEstadoBadge(partida.estado)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Inicio</p>
                          <p className="text-sm font-medium">
                            {partida.fecha_inicio ? new Date(partida.fecha_inicio).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Cartón</p>
                          <p className="text-sm font-medium">${partida.precio_carton?.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Total Cartones</p>
                          <p className="text-sm font-medium text-indigo-600">{partida.cantidad_total_cartones || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Máx/jugador</p>
                          <p className="text-sm font-medium">{partida.max_cartones_por_jugador}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Vendidos</p>
                          <p className="text-sm font-medium">{partida.cartones_vendidos || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Modos</p>
                          <p className="text-sm font-medium text-green-600">{partida.modos_juego?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(partida)}
                      disabled={partida.estado === 'finalizada'}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (confirm('¿Estás seguro de eliminar esta partida?')) {
                          deleteMutation.mutate(partida.id);
                        }
                      }}
                      disabled={partida.estado === 'en_curso'}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}