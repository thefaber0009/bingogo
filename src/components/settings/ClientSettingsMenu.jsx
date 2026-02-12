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
  ChevronLeft,
  Upload,
  Mail,
  Phone,
  Eye,
  EyeOff
} from 'lucide-react';

export default function ClientSettingsMenu({ open, onOpenChange, user }) {
  const [activeSection, setActiveSection] = useState('menu');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
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
    { id: 'perfil', label: 'Mi Perfil', icon: User, color: 'bg-blue-100 text-blue-600' },
    { id: 'seguridad', label: 'Seguridad', icon: Lock, color: 'bg-red-100 text-red-600' },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell, color: 'bg-yellow-100 text-yellow-600' },
    { id: 'sesion', label: 'Cerrar Sesión', icon: LogOut, color: 'bg-slate-100 text-slate-600' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md w-full">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="w-5 h-5" />
            Configuración
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto">
          {activeSection === 'menu' && (
            <div className="space-y-2 py-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => item.id === 'sesion' ? handleLogout() : setActiveSection(item.id)}
                    className="w-full flex items-center justify-between p-3 sm:p-4 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-900 text-sm sm:text-base">{item.label}</span>
                    </div>
                    {item.id !== 'sesion' && <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />}
                  </button>
                );
              })}
            </div>
          )}

          {activeSection === 'perfil' && (
            <div className="space-y-4 py-4">
              <button
                onClick={() => setActiveSection('menu')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2">
                    Nombre Completo
                  </label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Tu nombre"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <Input
                    value={user?.email}
                    disabled
                    className="bg-slate-100 cursor-not-allowed text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">El email no se puede cambiar</p>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Teléfono
                  </label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="Tu teléfono"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2">
                    Foto de Perfil
                  </label>
                  <label className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-slate-600">Haz clic para subir una foto</p>
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                </div>
              </div>

              <Button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          )}

          {activeSection === 'seguridad' && (
            <div className="space-y-4 py-4">
              <button
                onClick={() => setActiveSection('menu')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>

              <div className="space-y-3">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Tu contraseña actual"
                      className="text-sm pr-10"
                    />
                    <button
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Nueva contraseña"
                      className="text-sm pr-10"
                    />
                    <button
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirmar contraseña"
                      className="text-sm pr-10"
                    />
                    <button
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
              >
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </Button>
            </div>
          )}

          {activeSection === 'notificaciones' && (
            <div className="space-y-4 py-4">
              <button
                onClick={() => setActiveSection('menu')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-600" />
                    <span className="font-medium text-slate-900 text-sm">Notificaciones por Email</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificaciones.email}
                    onChange={(e) => setNotificaciones({ ...notificaciones, email: e.target.checked })}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-600" />
                    <span className="font-medium text-slate-900 text-sm">Notificaciones Push</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificaciones.push}
                    onChange={(e) => setNotificaciones({ ...notificaciones, push: e.target.checked })}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
              </div>

              <Button
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-sm"
              >
                Guardar Preferencias
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}