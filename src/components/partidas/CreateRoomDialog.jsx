import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gem, Crown, Ticket, Users, Zap, Sprout, Wand2, Star,
  Plus, Trash2, ChevronDown
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ROOM_TYPES = [
  { id: 'vip', name: 'VIP', icon: Gem, description: 'Premio mayor, cartón premium' },
  { id: 'premium', name: 'Premium', icon: Crown, description: 'Premio intermedio, alta calidad' },
  { id: 'estandar', name: 'Estándar', icon: Ticket, description: 'Premio básico, económico' },
  { id: 'familiar', name: 'Familiar', icon: Users, description: 'Para toda la familia, divertido' },
  { id: 'express', name: 'Express', icon: Zap, description: 'Partidas rápidas, premios ágiles' },
  { id: 'principiante', name: 'Principiante', icon: Sprout, description: 'Ideal para nuevos jugadores' },
  { id: 'tematica', name: 'Temática', icon: Wand2, description: 'Salas con temas especiales' },
  { id: 'especial', name: 'Especial', icon: Star, description: 'Eventos exclusivos y limitados' }
];

const GAME_MODES = [
  'Marco Grande', 'Letra H', 'Letra L', 'Letra T', 'Letra X',
  '4 Esquinas', 'Casa Llena', '1 Línea', '2 Líneas', 'Zig-Zag', 'Pirámide'
];

export default function CreateRoomDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    cantidadCartones: '',
    precioCarton: '1',
    maxCartonesPorJugador: '',
    maxJugadores: '',
    duracionMaxima: '',
    capacidad: 'ilimitada',
    limiteJugadores: '',
    fechaInicio: '',
    horaInicio: '',
    salaRecurrente: false,
    diasRecurrencia: [],
    horaRecurrencia: '',
    combos: [{ nombre: '', cantidad: '', precio: '' }],
    modos: {},
    modosPrecio: {}
  });

  const calcularValorPremioTotal = () => {
    return Object.keys(formData.modos).reduce((total, mode) => {
      if (formData.modos[mode] && formData.modosPrecio[mode]) {
        return total + (parseFloat(formData.modosPrecio[mode]) || 0);
      }
      return total;
    }, 0);
  };

  const [selectedType, setSelectedType] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addCombo = () => {
    setFormData(prev => ({
      ...prev,
      combos: [...prev.combos, { nombre: '', cantidad: '', precio: '' }]
    }));
  };

  const removeCombo = (index) => {
    setFormData(prev => ({
      ...prev,
      combos: prev.combos.filter((_, i) => i !== index)
    }));
  };

  const toggleMode = (mode) => {
    setFormData(prev => ({
      ...prev,
      modos: {
        ...prev.modos,
        [mode]: !prev.modos[mode]
      }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !selectedType || !formData.cantidadCartones || !formData.fechaInicio) {
      alert('Por favor completa los campos requeridos (nombre, tipo, cantidad, fecha)');
      return;
    }
    
    const fechaHora = formData.horaInicio 
      ? `${formData.fechaInicio}T${formData.horaInicio}:00`
      : `${formData.fechaInicio}T00:00:00`;

    const submitData = {
      nombre: formData.nombre,
      tipo: selectedType,
      cantidad_total_cartones: parseInt(formData.cantidadCartones),
      fecha_inicio: new Date(fechaHora).toISOString(),
      precio_carton: parseFloat(formData.precioCarton) || 1,
      max_cartones_por_jugador: formData.maxCartonesPorJugador ? parseInt(formData.maxCartonesPorJugador) : null,
      max_jugadores: formData.maxJugadores ? parseInt(formData.maxJugadores) : null,
      duracion_maxima: formData.duracionMaxima ? parseInt(formData.duracionMaxima) : null,
      combos: formData.combos.filter(c => c.nombre && c.cantidad && c.precio),
      modos_juego: Object.keys(formData.modos).filter(m => formData.modos[m]).map(m => ({
        tipo: m,
        nombre: m,
        premio: parseInt(formData.modosPrecio[m]) || 0
      })),
    };

    const partidaCreada = await onSubmit(submitData);
    
    // Generar cartones automáticamente después de crear la partida
    if (partidaCreada?.id) {
      const seededRandom = (seed) => {
        let state = seed;
        return () => {
          state = (state * 1103515245 + 12345) & 0x7fffffff;
          return state / 0x7fffffff;
        };
      };

      const generarCartonDeterminista = (numeroCarton) => {
        const random = seededRandom(numeroCarton * 9999);
        const rangos = [[1, 15], [16, 30], [31, 45], [46, 60], [61, 75]];
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

      const cartones = [];
      for (let i = 1; i <= parseInt(formData.cantidadCartones); i++) {
        cartones.push({
          partida_id: partidaCreada.id,
          numero_carton: i,
          numeros: generarCartonDeterminista(i),
          estado: 'activo',
          comprado: false,
          pagado: false,
          marcados: []
        });
      }
      
      console.log('Creando', cartones.length, 'cartones para partida:', partidaCreada.id);
      const cartonesCreados = await base44.entities.Carton.bulkCreate(cartones);
      console.log('Cartones creados exitosamente:', cartonesCreados?.length || 'desconocido');
    }
    
    setFormData({
      nombre: '',
      tipo: '',
      cantidadCartones: '',
      precioCarton: '1',
      maxCartonesPorJugador: '',
      maxJugadores: '',
      duracionMaxima: '',
      capacidad: 'ilimitada',
      limiteJugadores: '',
      fechaInicio: '',
      horaInicio: '',
      salaRecurrente: false,
      diasRecurrencia: [],
      horaRecurrencia: '',
      combos: [{ nombre: '', cantidad: '', precio: '' }],
      modos: {},
      modosPrecio: {}
    });
    setSelectedType(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Sala de Bingo</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nombre */}
          <div>
            <Label>Nombre de la Sala</Label>
            <Input
              placeholder="Ej: Sala Diamante"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>

          {/* Tipos de Sala */}
          <div>
            <Label className="mb-3 block">Tipo de Sala</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ROOM_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      selectedType === type.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                    <p className="text-sm font-semibold">{type.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cantidad de Cartones y Precio */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cantidad de Cartones</Label>
              <Input
                type="number"
                placeholder="Ej: 100"
                min="1"
                value={formData.cantidadCartones}
                onChange={(e) => setFormData({ ...formData, cantidadCartones: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">Número máximo de cartones disponibles</p>
            </div>
            <div>
              <Label>Precio por Cartón ($)</Label>
              <Input
                type="number"
                placeholder="Ej: 5"
                min="0.01"
                step="0.01"
                value={formData.precioCarton}
                onChange={(e) => setFormData({ ...formData, precioCarton: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">Precio individual de cada cartón</p>
            </div>
          </div>

          {/* Límites (Opcionales) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Máximo Cartones por Jugador (Opcional)</Label>
              <Input
                type="number"
                placeholder="Ej: 4"
                min="1"
                value={formData.maxCartonesPorJugador}
                onChange={(e) => setFormData({ ...formData, maxCartonesPorJugador: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">Límite de cartones que puede comprar cada jugador</p>
            </div>
            <div>
              <Label>Máximo de Jugadores (Opcional)</Label>
              <Input
                type="number"
                placeholder="Ej: 50"
                min="1"
                value={formData.maxJugadores}
                onChange={(e) => setFormData({ ...formData, maxJugadores: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">Límite de jugadores en la sala</p>
            </div>
          </div>

          {/* Configuración Avanzada */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('advanced')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50"
            >
              <span className="font-semibold flex items-center gap-2">
                ⚙️ Configuración Avanzada
              </span>
              <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.advanced ? 'rotate-180' : ''}`} />
            </button>
            {expandedSections.advanced && (
              <div className="p-4 border-t space-y-6 bg-slate-50">
                <div>
                  <Label htmlFor="duracion">Duración Máxima (minutos)</Label>
                  <Input
                    id="duracion"
                    type="number"
                    placeholder="Ej: 60"
                    min="10"
                    value={formData.duracionMaxima}
                    onChange={(e) => setFormData({ ...formData, duracionMaxima: e.target.value })}
                  />
                  <p className="text-xs text-slate-500 mt-1">Tiempo máximo para completar todos los juegos en esta sala</p>
                </div>

                <div>
                  <Label>Capacidad de Jugadores</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="ilimitada"
                        checked={formData.capacidad === 'ilimitada'}
                        onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                      />
                      <span className="text-sm">Ilimitada</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="limitada"
                        checked={formData.capacidad === 'limitada'}
                        onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                      />
                      <span className="text-sm">Limitada</span>
                    </label>
                  </div>
                  {formData.capacidad === 'limitada' && (
                    <Input
                      type="number"
                      placeholder="Ej: 50"
                      min="2"
                      className="mt-2"
                      value={formData.limiteJugadores}
                      onChange={(e) => setFormData({ ...formData, limiteJugadores: e.target.value })}
                    />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div>
                     <Label htmlFor="fechaInicio">Programación de la Sala</Label>
                     <p className="text-xs text-slate-500 mb-2">Fecha de Inicio</p>
                     <Input
                       id="fechaInicio"
                       type="date"
                       value={formData.fechaInicio}
                       onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                     />
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-2">Hora</p>
                     <Input
                       type="time"
                       value={formData.horaInicio}
                       onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                     />
                   </div>
                   <div className="flex flex-col justify-end">
                     <p className="text-xs text-slate-500 mb-2">¿Sala Recurrente?</p>
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={formData.salaRecurrente}
                         onChange={(e) => setFormData({ ...formData, salaRecurrente: e.target.checked })}
                       />
                       <span className="text-sm">Activar</span>
                     </label>
                   </div>
                 </div>

                {formData.salaRecurrente && (
                  <div className="space-y-3 border-t pt-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Días de Recurrencia</p>
                      <div className="flex gap-2 flex-wrap">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab', 'Dom'].map((day, idx) => (
                          <button
                            key={day}
                            onClick={() => {
                              const newDias = [...formData.diasRecurrencia];
                              const dayIndex = newDias.indexOf(idx);
                              if (dayIndex > -1) {
                                newDias.splice(dayIndex, 1);
                              } else {
                                newDias.push(idx);
                              }
                              setFormData({ ...formData, diasRecurrencia: newDias });
                            }}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              formData.diasRecurrencia.includes(idx)
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Hora</p>
                      <Input
                        type="time"
                        value={formData.horaRecurrencia}
                        onChange={(e) => setFormData({ ...formData, horaRecurrencia: e.target.value })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Combos de Cartones y Modos de Juego */}
          <div className="space-y-4">
            {/* Combos de Cartones */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Combos de Cartones</Label>
                <Button size="sm" variant="outline" onClick={addCombo}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Combo
                </Button>
              </div>
              <p className="text-xs text-slate-500 mb-3">Configure combos para ver el resumen</p>
              <div className="space-y-2">
                {formData.combos.map((combo, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-white flex gap-2 items-end">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Nombre</p>
                      <Input
                        placeholder="Ej: Pack 5"
                        value={combo.nombre}
                        className="h-8 text-sm"
                        onChange={(e) => {
                          const newCombos = [...formData.combos];
                          newCombos[idx].nombre = e.target.value;
                          setFormData({ ...formData, combos: newCombos });
                        }}
                      />
                    </div>
                    <div className="w-24">
                      <p className="text-xs text-slate-500 mb-1">Cantidad</p>
                      <Input
                        type="number"
                        placeholder="2"
                        min="2"
                        className="h-8 text-sm"
                        value={combo.cantidad}
                        onChange={(e) => {
                          const newCombos = [...formData.combos];
                          newCombos[idx].cantidad = e.target.value;
                          setFormData({ ...formData, combos: newCombos });
                        }}
                      />
                    </div>
                    <div className="w-24">
                      <p className="text-xs text-slate-500 mb-1">$ Precio</p>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        className="h-8 text-sm"
                        value={combo.precio}
                        onChange={(e) => {
                          const newCombos = [...formData.combos];
                          newCombos[idx].precio = e.target.value;
                          setFormData({ ...formData, combos: newCombos });
                        }}
                      />
                    </div>
                    {formData.combos.length > 1 && (
                      <Button size="sm" variant="ghost" onClick={() => removeCombo(idx)} className="h-8">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modos de Juego con Premios */}
            <div className="border-t pt-4">
              <Label className="mb-3 block">Modos de Juego con Premios</Label>
              <p className="text-xs text-slate-500 mb-3">Configure juegos de esta manera</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {GAME_MODES.map(mode => (
                  <div key={mode} className="border rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={formData.modos[mode] || false}
                        onChange={() => toggleMode(mode)}
                      />
                      <span className="text-xs font-medium flex-1">{mode}</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="Precio"
                      min="0"
                      className="w-full h-8 text-xs"
                      value={formData.modosPrecio[mode] || ''}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          modosPrecio: {
                            ...formData.modosPrecio,
                            [mode]: e.target.value
                          }
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen de Configuración */}
          <div className="border rounded-lg p-4 bg-slate-50 space-y-4">
            <h3 className="font-semibold text-sm">Resumen de Configuración</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Modos de Juego</p>
                <p className="text-sm font-semibold">{Object.values(formData.modos).filter(Boolean).length} configurado(s)</p>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-slate-600">
                  Selecciona modos y establece precios para ver el resumen
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Combos de Cartones</p>
                <p className="text-sm font-semibold">{formData.combos.filter(c => c.nombre).length} combo(s)</p>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-slate-600">
                  Configura combos para ver el resumen
                </Button>
              </div>
            </div>
          </div>

          {/* Valor Premio */}
          <div>
            <Label>Valor del Premio Total</Label>
            <Input
              type="number"
              readOnly
              value={calcularValorPremioTotal()}
              className="bg-slate-100 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">Suma automática de precios de modos activos</p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {isLoading ? 'Creando...' : 'Crear Sala'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}