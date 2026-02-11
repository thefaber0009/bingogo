import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Trophy,
  GamepadIcon,
  TrendingUp,
  Edit,
  Save,
  X
} from 'lucide-react';

export default function Perfil() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
  });

  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: cartones = [] } = useQuery({
    queryKey: ['userCartones', user?.id],
    queryFn: () => base44.entities.Carton.filter({ jugador_id: user.id }),
    enabled: !!user,
  });

  const { data: partidas = [] } = useQuery({
    queryKey: ['partidas'],
    queryFn: () => base44.entities.Partida.list(),
  });

  const { data: premios = [] } = useQuery({
    queryKey: ['userPremios', user?.id],
    queryFn: () => base44.entities.Premio.filter({ jugador_id: user.id }),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      setIsEditing(false);
    },
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const partidasJugadas = cartones.length;
  const partidasGanadas = premios.length;
  const premiosTotal = premios.reduce((sum, p) => sum + (p.valor || 0), 0);
  const efectividad = partidasJugadas > 0 ? ((partidasGanadas / partidasJugadas) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-slate-600 mt-1">Información personal y estadísticas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Personal */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Información Personal</CardTitle>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ full_name: user.full_name || '' });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-4xl">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nombre Completo</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email} disabled className="bg-slate-50" />
                      <p className="text-xs text-slate-500">El email no se puede modificar</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Rol</Label>
                      <Input value={user?.role} disabled className="bg-slate-50" />
                    </div>
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600"
                      disabled={updateMutation.isLoading}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </Button>
                  </form>
                ) : (
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Nombre</p>
                      <p className="text-lg font-semibold text-slate-900">{user?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </p>
                      <p className="text-lg font-semibold text-slate-900">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Rol
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        user?.role === 'admin' 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user?.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Fecha de Registro</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {user?.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen Rápido */}
        <div className="space-y-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardContent className="p-6">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-slate-600 font-medium">Premios Ganados</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{partidasGanadas}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="text-center">
                <GamepadIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-slate-600 font-medium">Partidas Jugadas</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{partidasJugadas}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estadísticas Detalladas */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Estadísticas del Jugador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <p className="text-sm text-slate-600 font-medium mb-2">Partidas Jugadas</p>
              <p className="text-3xl font-bold text-blue-600">{partidasJugadas}</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <p className="text-sm text-slate-600 font-medium mb-2">Partidas Ganadas</p>
              <p className="text-3xl font-bold text-green-600">{partidasGanadas}</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
              <p className="text-sm text-slate-600 font-medium mb-2">Efectividad</p>
              <p className="text-3xl font-bold text-amber-600">{efectividad}%</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <p className="text-sm text-slate-600 font-medium mb-2">Premios Totales</p>
              <p className="text-3xl font-bold text-purple-600">${premiosTotal.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mis Cartones Activos */}
      {cartones.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GamepadIcon className="w-5 h-5 text-indigo-600" />
              Mis Cartones Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Cartón</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Sala</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Estado</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Pagado</th>
                  </tr>
                </thead>
                <tbody>
                  {cartones.map((carton) => {
                    const partida = partidas.find(p => p.id === carton.partida_id);
                    return (
                      <tr key={carton.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">#{carton.numero_carton} - {carton.id.substring(0, 8).toUpperCase()}</td>
                        <td className="py-3 px-4 text-slate-700">{partida?.nombre || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            carton.estado === 'activo' ? 'bg-green-100 text-green-700' :
                            carton.estado === 'ganador' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {carton.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            carton.pagado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {carton.pagado ? '✓ Pagado' : '✗ Pendiente'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de Premios */}
      {premios.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Historial de Premios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {premios.map((premio) => (
                <div key={premio.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{premio.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {premio.created_date ? new Date(premio.created_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">${premio.valor?.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      premio.estado_pago === 'pagado' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {premio.estado_pago}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}