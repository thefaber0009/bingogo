import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock, User, Phone, FileText, LogIn, UserPlus } from 'lucide-react';

export default function AuthDialog({ open, onClose, onSuccess }) {
  const [modo, setModo] = useState('login'); // 'login' o 'registro'
  const [loading, setLoading] = useState(false);
  const [recordarme, setRecordarme] = useState(false);

  // Estados para login
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Estados para registro
  const [registroData, setRegistroData] = useState({
    nombres: '',
    apellidos: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    telefono: '',
    email: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Redirigir al login de base44
      const currentUrl = window.location.href;
      base44.auth.redirectToLogin(currentUrl);
    } catch (error) {
      alert('Error al iniciar sesión: ' + error.message);
      setLoading(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Redirigir al login/registro de base44
      const currentUrl = window.location.href;
      base44.auth.redirectToLogin(currentUrl);
    } catch (error) {
      alert('Error al registrarse: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-md p-0 bg-transparent border-none shadow-none">
        <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-1 rounded-2xl sm:rounded-3xl">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8">
            {/* Logo y Título */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl sm:text-2xl">🎲</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Bingo Manía</h1>
              </div>
              {modo === 'login' ? null : <h2 className="text-lg sm:text-xl font-semibold text-slate-700">Crear Cuenta</h2>}
            </div>

            {modo === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                {/* Correo Electrónico */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Mail className="w-4 h-4" />
                    Correo Electrónico
                  </label>
                  <Input
                    type="email"
                    placeholder="Ingresa tu correo"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    className="border-2 border-indigo-300 focus:border-indigo-600 rounded-xl"
                    required
                  />
                </div>

                {/* Contraseña */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Lock className="w-4 h-4" />
                    Contraseña
                  </label>
                  <Input
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    className="border-2 border-indigo-300 focus:border-indigo-600 rounded-xl"
                    required
                  />
                </div>

                {/* Recordarme */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="recordarme"
                    checked={recordarme}
                    onCheckedChange={setRecordarme}
                  />
                  <label htmlFor="recordarme" className="text-sm text-slate-600 cursor-pointer">
                    Recordarme
                  </label>
                </div>

                {/* Botón Ingresar */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 rounded-xl text-base"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  {loading ? 'Cargando...' : 'Ingresar'}
                </Button>

                {/* Links */}
                <div className="space-y-3 text-center">
                  <button type="button" className="text-indigo-600 hover:underline text-sm font-medium">
                    Recuperar 🔑 Contraseña
                  </button>
                  
                  <div className="text-sm text-slate-600">
                    ¿No tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => setModo('registro')}
                      className="text-indigo-600 hover:underline font-semibold"
                    >
                      👤 Registrarse
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegistro} className="space-y-3 sm:space-y-4">
                {/* Nombres */}
                <Input
                  type="text"
                  placeholder="Nombres"
                  value={registroData.nombres}
                  onChange={(e) => setRegistroData({...registroData, nombres: e.target.value})}
                  className="border-2 border-slate-300 focus:border-indigo-600 rounded-xl"
                  required
                />

                {/* Apellidos */}
                <Input
                  type="text"
                  placeholder="Apellidos"
                  value={registroData.apellidos}
                  onChange={(e) => setRegistroData({...registroData, apellidos: e.target.value})}
                  className="border-2 border-slate-300 focus:border-indigo-600 rounded-xl"
                  required
                />

                {/* Tipo de Documento */}
                <Select
                  value={registroData.tipoDocumento}
                  onValueChange={(value) => setRegistroData({...registroData, tipoDocumento: value})}
                >
                  <SelectTrigger className="border-2 border-slate-300 focus:border-indigo-600 rounded-xl">
                    <SelectValue placeholder="Tipo de Documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                    <SelectItem value="PP">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>

                {/* Número de Documento */}
                <Input
                  type="text"
                  placeholder="Número de Documento"
                  value={registroData.numeroDocumento}
                  onChange={(e) => setRegistroData({...registroData, numeroDocumento: e.target.value})}
                  className="border-2 border-slate-300 focus:border-indigo-600 rounded-xl"
                  required
                />

                {/* Número de Teléfono */}
                <Input
                  type="tel"
                  placeholder="Número de Teléfono"
                  value={registroData.telefono}
                  onChange={(e) => setRegistroData({...registroData, telefono: e.target.value})}
                  className="border-2 border-slate-300 focus:border-indigo-600 rounded-xl"
                  required
                />

                {/* Correo Electrónico */}
                <Input
                  type="email"
                  placeholder="Correo Electrónico"
                  value={registroData.email}
                  onChange={(e) => setRegistroData({...registroData, email: e.target.value})}
                  className="border-2 border-slate-300 focus:border-indigo-600 rounded-xl"
                  required
                />

                {/* Contraseña */}
                <Input
                  type="password"
                  placeholder="Contraseña (mínimo 6 caracteres)"
                  value={registroData.password}
                  onChange={(e) => setRegistroData({...registroData, password: e.target.value})}
                  className="border-2 border-slate-300 focus:border-indigo-600 rounded-xl"
                  required
                  minLength={6}
                />

                {/* Botón Registrarse */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 rounded-xl text-base"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  {loading ? 'Cargando...' : 'Registrarse'}
                </Button>

                {/* Link a Login */}
                <div className="text-center text-sm text-slate-600">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setModo('login')}
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    🔑 Inicia sesión aquí
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}