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
    duracionMaxima: '',
    capacidad: 'ilimitada',
    limiteJugadores: '',
    fechaInicio: '',
    salaRecurrente: false,
    diasRecurrencia: [],
    horaRecurrencia: '',
    combos: [{ nombre: '', cantidad: '', precio: '' }],
    modos: {},
    valorPremio: ''
  });

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
    if (!formData.nombre || !selectedType) {
      alert('Por favor completa los campos requeridos');
      return;
    }
    
    const submitData = {
      nombre: formData.nombre,
      tipo: selectedType,
      cantidad_total_cartones: parseInt(formData.cantidadCartones),
      duracion_maxima: formData.duracionMaxima ? parseInt(formData.duracionMaxima) : null,
      combos: formData.combos.filter(c => c.nombre && c.cantidad && c.precio),
      modos_juego: Object.keys(formData.modos).filter(m => formData.modos[m]).map(m => ({
        tipo: m,
        nombre: m,
        premio: 0
      })),
      max_jugadores: formData.capacidad === 'limitada' ? parseInt(formData.limiteJugadores) : null,
      valor_premio: formData.valorPremio ? parseInt(formData.valorPremio) : null
    };

    await onSubmit(submitData);
    setFormData({
      nombre: '',
      tipo: '',
      cantidadCartones: '',
      duracionMaxima: '',
      capacidad: 'ilimitada',
      limiteJugadores: '',
      fechaInicio: '',
      salaRecurrente: false,
      diasRecurrencia: [],
      horaRecurrencia: '',
      combos: [{ nombre: '', cantidad: '', precio: '' }],
      modos: {},
      valorPremio: ''
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

          {/* Cantidad de Cartones */}
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

          {/* Configuración Avanzada */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('advanced')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50"
            >
              <span className="font-semibold">Configuración Avanzada</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.advanced ? 'rotate-180' : ''}`} />
            </button>
            {expandedSections.advanced && (
              <div className="p-4 border-t space-y-4 bg-slate-50">
                <div>
                  <Label>Duración Máxima (minutos)</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 60"
                    min="10"
                    value={formData.duracionMaxima}
                    onChange={(e) => setFormData({ ...formData, duracionMaxima: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Capacidad de Jugadores</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="ilimitada"
                        checked={formData.capacidad === 'ilimitada'}
                        onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                      />
                      Ilimitada
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="limitada"
                        checked={formData.capacidad === 'limitada'}
                        onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                      />
                      Limitada
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
              </div>
            )}
          </div>

          {/* Combos */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Combos de Cartones</Label>
              <Button size="sm" variant="outline" onClick={addCombo}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {formData.combos.map((combo, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder="Nombre"
                    value={combo.nombre}
                    onChange={(e) => {
                      const newCombos = [...formData.combos];
                      newCombos[idx].nombre = e.target.value;
                      setFormData({ ...formData, combos: newCombos });
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Cantidad"
                    min="2"
                    className="w-24"
                    value={combo.cantidad}
                    onChange={(e) => {
                      const newCombos = [...formData.combos];
                      newCombos[idx].cantidad = e.target.value;
                      setFormData({ ...formData, combos: newCombos });
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Precio"
                    min="0"
                    className="w-24"
                    value={combo.precio}
                    onChange={(e) => {
                      const newCombos = [...formData.combos];
                      newCombos[idx].precio = e.target.value;
                      setFormData({ ...formData, combos: newCombos });
                    }}
                  />
                  {formData.combos.length > 1 && (
                    <Button size="sm" variant="destructive" onClick={() => removeCombo(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Modos de Juego */}
          <div>
            <Label className="mb-3 block">Modos de Juego</Label>
            <div className="grid grid-cols-2 gap-3">
              {GAME_MODES.map(mode => (
                <label key={mode} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.modos[mode] || false}
                    onChange={() => toggleMode(mode)}
                  />
                  <span className="text-sm">{mode}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Valor Premio */}
          <div>
            <Label>Valor del Premio Total</Label>
            <Input
              type="number"
              placeholder="Ej: 500000"
              value={formData.valorPremio}
              onChange={(e) => setFormData({ ...formData, valorPremio: e.target.value })}
            />
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