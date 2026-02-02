import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send, Users, User } from 'lucide-react';

export default function Notificaciones() {
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
    destinatario: 'todos',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Funcionalidad de envío de notificaciones: Requiere integración con Firebase Cloud Messaging');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Notificaciones Push</h1>
        <p className="text-slate-600 mt-1">Envía notificaciones a los jugadores</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              Crear Notificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  placeholder="Ej: Nueva partida disponible"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensaje">Mensaje</Label>
                <Textarea
                  id="mensaje"
                  placeholder="Escribe el mensaje de la notificación..."
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinatario">Destinatarios</Label>
                <Select value={formData.destinatario} onValueChange={(v) => setFormData({ ...formData, destinatario: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los usuarios</SelectItem>
                    <SelectItem value="activos">Usuarios activos</SelectItem>
                    <SelectItem value="individual">Usuario individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                <Send className="w-4 h-4 mr-2" />
                Enviar Notificación
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">
                    {formData.titulo || 'Título de la notificación'}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {formData.mensaje || 'Mensaje de la notificación aparecerá aquí...'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {formData.destinatario === 'todos' ? (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Todos los usuarios</span>
                    </>
                  ) : formData.destinatario === 'activos' ? (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Usuarios activos</span>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4" />
                      <span>Usuario individual</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Esta funcionalidad requiere configuración de Firebase Cloud Messaging (FCM) para el envío real de notificaciones push.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}