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
  Clock
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Partidas() {
  const [open, setOpen] = useState(false);
  const [editingPartida, setEditingPartida] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    fecha_inicio: '',
    monto_entrada: '',
    premio_total: '',
    tipo_premio: 'efectivo',
    max_jugadores: '',
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
      resetForm();
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
      monto_entrada: '',
      premio_total: '',
      tipo_premio: 'efectivo',
      max_jugadores: '',
    });
    setEditingPartida(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      monto_entrada: parseFloat(formData.monto_entrada),
      premio_total: parseFloat(formData.premio_total),
      max_jugadores: parseInt(formData.max_jugadores),
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
      monto_entrada: partida.monto_entrada?.toString() || '',
      premio_total: partida.premio_total?.toString() || '',
      tipo_premio: partida.tipo_premio || 'efectivo',
      max_jugadores: partida.max_jugadores?.toString() || '',
    });
    setOpen(true);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Partidas</h1>
          <p className="text-slate-600 mt-1">Administra todas las partidas de bingo</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Partida
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPartida ? 'Editar Partida' : 'Nueva Partida'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
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
                  <Label htmlFor="monto_entrada">Precio por Cartón</Label>
                  <Input
                    id="monto_entrada"
                    type="number"
                    step="0.01"
                    value={formData.monto_entrada}
                    onChange={(e) => setFormData({ ...formData, monto_entrada: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="premio_total">Premio Total</Label>
                  <Input
                    id="premio_total"
                    type="number"
                    step="0.01"
                    value={formData.premio_total}
                    onChange={(e) => setFormData({ ...formData, premio_total: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_premio">Tipo de Premio</Label>
                  <Select value={formData.tipo_premio} onValueChange={(v) => setFormData({ ...formData, tipo_premio: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="creditos">Créditos</SelectItem>
                      <SelectItem value="fisico">Físico</SelectItem>
                    </SelectContent>
                  </Select>
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
              <div className="flex justify-end gap-3 pt-4">
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
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {partidas.map((partida) => (
            <Card key={partida.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-slate-900">{partida.nombre}</h3>
                      {getEstadoBadge(partida.estado)}
                    </div>
                    <div className="grid grid-cols-4 gap-6">
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
                          <p className="text-xs text-slate-500">Entrada</p>
                          <p className="text-sm font-medium">${partida.monto_entrada?.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Jugadores</p>
                          <p className="text-sm font-medium">{partida.cartones_vendidos || 0} / {partida.max_jugadores || '∞'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Premio</p>
                          <p className="text-sm font-medium text-green-600">${partida.premio_total?.toFixed(2)}</p>
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
          ))}
          {partidas.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-12 text-center">
                <p className="text-slate-500">No hay partidas registradas. Crea tu primera partida.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}