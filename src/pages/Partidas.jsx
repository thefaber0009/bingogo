import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Trophy,
  Power
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
  const [selectedTab, setSelectedTab] = useState('todas');
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
    mutationFn: async (data) => {
      // Primero crear la partida
      const partida = await base44.entities.Partida.create({
        ...data,
        estado: 'pendiente',
        cartones_vendidos: 0,
        max_cartones_por_jugador: 4
      });

      // Generar función determinista
      const seededRandom = (seed) => {
        let state = seed;
        return () => {
          state = (state * 1103515245 + 12345) & 0x7fffffff;
          return state / 0x7fffffff;
        };
      };

      const generarCartonDeterminista = (numeroCarton) => {
        const random = seededRandom(numeroCarton * 9999);
        const rangos = [
          [1, 15], [16, 30], [31, 45], [46, 60], [61, 75]
        ];
        const carton = [];
        const numerosUsadosPorColumna = [[], [], [], [], []];
        for (let row = 0; row < 5; row++) {
          const fila = [];
          for (let col = 0; col < 5; col++) {
            if (col === 2 && row === 2) {
              fila.push(0);
            } else {
              const [min, max] = rangos[col];
              const numerosDisponibles = Array.from(
                { length: max - min + 1 },
                (_, i) => i + min
              ).filter(n => !numerosUsadosPorColumna[col].includes(n));
              const num = numerosDisponibles[Math.floor(random() * numerosDisponibles.length)];
              numerosUsadosPorColumna[col].push(num);
              fila.push(num);
            }
          }
          carton.push(fila);
        }
        return carton;
      };

      // Pre-generar todos los cartones de la partida
      const cartones = [];
      for (let i = 1; i <= data.cantidad_total_cartones; i++) {
        cartones.push({
          partida_id: partida.id,
          numero_carton: i,
          numeros: generarCartonDeterminista(i),
          jugador_id: null,
          estado: 'activo',
          comprado: false,
          pagado: false,
          marcados: []
        });
      }

      // Crear todos los cartones en batch
      await base44.entities.Carton.bulkCreate(cartones);

      return partida;
    },
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

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, estado }) => base44.entities.Partida.update(id, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries(['partidas']);
    },
  });

  const handleToggleActive = (partida) => {
    const nuevoEstado = partida.estado === 'en_curso' ? 'pendiente' : 'en_curso';
    toggleActiveMutation.mutate({ id: partida.id, estado: nuevoEstado });
  };

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
    const partida = await createRoomMutation.mutateAsync(data);
    return partida;
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
    let matchEstado = false;
    
    if (selectedTab === 'todas') matchEstado = true;
    else if (selectedTab === 'activas') matchEstado = p.estado === 'en_curso';
    else if (selectedTab === 'en_proceso') matchEstado = p.estado === 'pendiente';
    else if (selectedTab === 'inactivas') matchEstado = p.estado === 'finalizada';
    
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

      {/* Encabezado Salas de Juego */}
       <div className="flex items-center justify-between">
         <div>
           <p className="text-sm text-slate-600 mb-2">Salas de Juego</p>
         </div>
         <div className="relative flex-1 max-w-xs">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
           <Input
             placeholder="Buscar salas..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="pl-10 h-9 text-sm"
           />
         </div>
       </div>

       {/* Tabs */}
       <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
         <TabsList className="gap-2 bg-transparent">
           <TabsTrigger 
             value="todas"
             className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-4 py-2 text-sm font-medium"
           >
             Todas
           </TabsTrigger>
           <TabsTrigger 
             value="activas"
             className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-4 py-2 text-sm font-medium"
           >
             Activas
           </TabsTrigger>
           <TabsTrigger 
             value="en_proceso"
             className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-4 py-2 text-sm font-medium"
           >
             En proceso
           </TabsTrigger>
           <TabsTrigger 
             value="inactivas"
             className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-4 py-2 text-sm font-medium"
           >
             Inactivas
           </TabsTrigger>
         </TabsList>
       </Tabs>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPartidas.length === 0 ? (
            <Card className="border-0 shadow-xl col-span-full">
              <CardContent className="py-20 text-center">
                <PlayCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No hay salas disponibles</p>
              </CardContent>
            </Card>
          ) : (
            filteredPartidas.map((partida) => (
            <Card key={partida.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">{partida.nombre}</h3>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    partida.estado === 'en_curso' ? 'bg-green-100 text-green-700' :
                    partida.estado === 'pendiente' ? 'bg-slate-200 text-slate-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {partida.estado === 'en_curso' ? 'Activa' : 
                     partida.estado === 'pendiente' ? 'Inactiva' : 'Finalizada'}
                  </span>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-sm border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-blue-500" />
                    <span className="text-slate-700">{partida.cantidad_total_cartones} cartones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <span className="text-slate-700">Premios$ {(partida.modos_juego?.reduce((sum, m) => sum + (m.premio || 0), 0) || 0).toLocaleString()}</span>
                  </div>
                  {partida.duracion_maxima && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className="text-slate-700">Duración: {partida.duracion_maxima} minutos</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span className="text-slate-700">Inicio: {partida.fecha_inicio ? new Date(partida.fecha_inicio).toLocaleString('es-ES', { month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-cyan-500" />
                    <span className="text-slate-700">{partida.modos_juego?.length || 0} modos de juego</span>
                  </div>
                </div>

                {/* Game Modes */}
                {partida.modos_juego && partida.modos_juego.length > 0 && (
                  <div className="space-y-2 border-b pb-3">
                    {partida.modos_juego.map((modo, idx) => (
                      <div key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded inline-block mr-2">
                        {modo.nombre} (${modo.premio || 0})
                      </div>
                    ))}
                  </div>
                )}

                {/* Combos */}
                {partida.combos && partida.combos.length > 0 && (
                  <div className="space-y-2 border-b pb-3">
                    <p className="text-xs font-semibold text-slate-600">Combos disponibles:</p>
                    <div className="space-y-1">
                      {partida.combos.map((combo, idx) => (
                        <div key={idx} className="flex justify-between text-xs bg-slate-50 p-2 rounded">
                          <span className="text-slate-700">{combo.nombre}</span>
                          <span className="text-slate-600">{combo.cantidad} cartones</span>
                          <span className="font-semibold text-slate-700">$ {combo.precio}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 flex-wrap">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleEdit(partida)} disabled={partida.estado === 'finalizada'}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs text-red-600 hover:text-red-700" onClick={() => { if (confirm('¿Estás seguro?')) deleteMutation.mutate(partida.id); }} disabled={partida.estado === 'en_curso'}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Eliminar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                    Panel
                  </Button>
                  <Button 
                    size="sm" 
                    className={`flex-1 h-8 text-xs ${partida.estado === 'en_curso' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                    onClick={() => handleToggleActive(partida)}
                    disabled={toggleActiveMutation.isLoading || partida.estado === 'finalizada'}
                  >
                    <Power className="w-3 h-3 mr-1" />
                    {partida.estado === 'en_curso' ? 'Desactivar' : 'Activar'}
                  </Button>
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