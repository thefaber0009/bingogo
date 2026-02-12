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
  EyeOff,
  CreditCard
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
  const [datoPago, setDatoPago] = useState({
    tipo_metodo: 'transferencia', // 'transferencia' o 'billetera'
    banco: user?.banco || '',
    tipo_cuenta: user?.tipo_cuenta || 'ahorros',
    numero_cuenta: user?.numero_cuenta || '',
    nombre_titular: user?.nombre_titular || '',
    numero_identificacion: user?.numero_identificacion || '',
    billetera: user?.billetera || '',
    telefono_billetera: user?.telefono_billetera || '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
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

  const handleSavePaymentData = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        tipo_metodo: datoPago.tipo_metodo,
        ...(datoPago.tipo_metodo === 'transferencia' ? {
          banco: datoPago.banco,
          tipo_cuenta: datoPago.tipo_cuenta,
          numero_cuenta: datoPago.numero_cuenta,
          nombre_titular: datoPago.nombre_titular,
          numero_identificacion: datoPago.numero_identificacion,
        } : {
          billetera: datoPago.billetera,
          telefono_billetera: datoPago.telefono_billetera,
          nombre_titular: datoPago.nombre_titular,
          numero_identificacion: datoPago.numero_identificacion,
        })
      });
      alert('Datos de pago actualizados exitosamente');
      setActiveSection('menu');
    } catch (error) {
      alert('Error al actualizar datos de pago');
    }
    setLoading(false);
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await base44.auth.updateMe({ profile_picture: file_url });
        alert('Foto de perfil actualizada exitosamente');
      } catch (error) {
        alert('Error al subir la foto');
      }
    }
  };

  const maskAccountNumber = (number) => {
    if (!number) return '';
    const numStr = number.toString();
    return '*'.repeat(numStr.length - 4) + numStr.slice(-4);
  };

  const menuItems = [
    { id: 'perfil', label: 'Mi Perfil', icon: User, color: 'bg-blue-100 text-blue-600' },
    { id: 'seguridad', label: 'Seguridad', icon: Lock, color: 'bg-red-100 text-red-600' },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell, color: 'bg-yellow-100 text-yellow-600' },
    { id: 'pago', label: 'Datos de Pago', icon: CreditCard, color: 'bg-green-100 text-green-600' },
    { id: 'sesion', label: 'Cerrar Sesión', icon: LogOut, color: 'bg-slate-100 text-slate-600' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-md w-[90vw] sm:w-full">
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
                  <label className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center min-h-40">
                    {profilePicture ? (
                      <>
                        <img src={URL.createObjectURL(profilePicture)} alt="preview" className="w-20 h-20 rounded-full object-cover mb-2" />
                        <p className="text-xs sm:text-sm text-blue-600 font-semibold">Foto seleccionada</p>
                        <p className="text-xs text-slate-500 mt-1">Haz clic para cambiar</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 mb-2" />
                        <p className="text-xs sm:text-sm text-slate-700 font-medium">Haz clic para subir una foto</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, máximo 5MB</p>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
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

          {activeSection === 'pago' && (
            <div className="space-y-4 py-4">
              <button
                onClick={() => setActiveSection('menu')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>

              <div>
                <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-3">
                  Método de Pago
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setDatoPago({ ...datoPago, tipo_metodo: 'transferencia' })}
                    className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                      datoPago.tipo_metodo === 'transferencia'
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900 text-sm">💳 Transferencia Bancaria</p>
                    <p className="text-xs text-slate-500">Directamente a tu cuenta bancaria</p>
                  </button>

                  <button
                    onClick={() => setDatoPago({ ...datoPago, tipo_metodo: 'billetera' })}
                    className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                      datoPago.tipo_metodo === 'billetera'
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900 text-sm">📱 Billetera Digital</p>
                    <p className="text-xs text-slate-500">Nequi, Daviplata, etc.</p>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {datoPago.tipo_metodo === 'transferencia' ? (
                  <>
                    <div>
                      <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2">
                        Banco
                      </label>
                      <Input
                        value={datoPago.banco}
                        onChange={(e) => setDatoPago({ ...datoPago, banco: e.target.value })}
                        placeholder="Ej: Bancolombia"
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2">
                        Tipo de Cuenta
                      </label>
                      <select
                        value={datoPago.tipo_cuenta}
                        onChange={(e) => setDatoPago({ ...datoPago, tipo_cuenta: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="ahorros">Ahorros</option>
                        <option value="corriente">Corriente</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2">
                        Número de Cuenta
                      </label>
                      <Input
                        value={datoPago.numero_cuenta}
                        onChange={(e) => setDatoPago({ ...datoPago, numero_cuenta: e.target.value })}
                        placeholder="Ej: 12345678901234567890"
                        className="text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2">
                        Billetera Digital
                      </label>
                      <Input
                        value={datoPago.billetera}
                        onChange={(e) => setDatoPago({ ...datoPago, billetera: e.target.value })}
                        placeholder="Ej: Nequi, Daviplata"
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2">
                        Número de Teléfono
                      </label>
                      <Input
                        value={datoPago.telefono_billetera}
                        onChange={(e) => setDatoPago({ ...datoPago, telefono_billetera: e.target.value })}
                        placeholder="Ej: 3001234567"
                        className="text-sm"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2">
                    Nombre del Titular
                  </label>
                  <Input
                    value={datoPago.nombre_titular}
                    onChange={(e) => setDatoPago({ ...datoPago, nombre_titular: e.target.value })}
                    placeholder="Tu nombre completo"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 block mb-2">
                    Número de Identificación
                  </label>
                  <Input
                    value={datoPago.numero_identificacion}
                    onChange={(e) => setDatoPago({ ...datoPago, numero_identificacion: e.target.value })}
                    placeholder="Ej: 1234567890"
                    className="text-sm"
                  />
                </div>
              </div>

              <Button
                onClick={handleSavePaymentData}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                {loading ? 'Guardando...' : 'Guardar Datos de Pago'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}