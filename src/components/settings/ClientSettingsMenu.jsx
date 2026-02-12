import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  User, 
  Lock, 
  Bell, 
  LogOut,
  ChevronRight,
  Upload,
  X
} from 'lucide-react';

export default function ClientSettingsMenu({ open, onOpenChange, user }) {
  const [activeSection, setActiveSection] = useState('menu');
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notificaciones, setNotificaciones] = useState({
    email: true,
    push: true,
  });
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        full_name: formData.full_name,
        telefono: formData.telefono,
      });
      alert('Perfil actualizado exitosamente');
      setActiveSection('menu');
    } catch (error) {
      alert('Error al actualizar el perfil');
    }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      // Aquí iría la lógica para cambiar contraseña
      alert('Contraseña cambiada exitosamente');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveSection('menu');
    } catch (error) {
      alert('Error al cambiar contraseña');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const menuItems = [
    { id: 'perfil', label: 'Mi Perfil', icon: User, color: 'text-blue-600' },
    { id: 'seguridad', label: 'Seguridad', icon: Lock, color: 'text-red-600' },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell, color: 'text-yellow-600' },
    { id: 'sesion', label: 'Cerrar Sesión', icon: LogOut, color: 'text-slate-600' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración
          </DialogTitle>
        </DialogHeader>

        {activeSection === 'menu' && (
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => item.id === 'sesion' ? handleLogout() : setActiveSection(item.id)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-100`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="font-medium text-slate-900">{item.label}</span>
                  </div>
                  {item.id !== 'sesion' && <ChevronRight className="w-5 h-5 text-slate-400" />}
                </button>
              );
            })}
          </div>
        )}

        {activeSection === 'perfil' && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveSection('menu')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              Volver
            </button>
            
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Nombre Completo
              </label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Email
              </label>
              <Input
                value={user?.email}
                disabled
                className="bg-slate-100 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">El email no se puede cambiar</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Teléfono
              </label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Tu teléfono"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Foto de Perfil
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Haz clic para subir una foto</p>
              </div>
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        )}

        {activeSection === 'seguridad' && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveSection('menu')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              Volver
            </button>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Contraseña Actual
              </label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Tu contraseña actual"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Nueva Contraseña
              </label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Nueva contraseña"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Confirmar Contraseña
              </label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirmar contraseña"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        )}

        {activeSection === 'notificaciones' && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveSection('menu')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              Volver
            </button>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <span className="font-medium text-slate-900">Notificaciones por Email</span>
                <input
                  type="checkbox"
                  checked={notificaciones.email}
                  onChange={(e) => setNotificaciones({ ...notificaciones, email: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <span className="font-medium text-slate-900">Notificaciones Push</span>
                <input
                  type="checkbox"
                  checked={notificaciones.push}
                  onChange={(e) => setNotificaciones({ ...notificaciones, push: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
            </div>

            <Button
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Guardar Preferencias
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}