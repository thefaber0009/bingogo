import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

const TIPOS_MODO = [
  { value: 'linea_horizontal', label: 'Línea Horizontal' },
  { value: 'linea_vertical', label: 'Línea Vertical' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'cuatro_esquinas', label: 'Cuatro Esquinas' },
  { value: 'carton_lleno', label: 'Cartón Lleno' },
  { value: 'cruz_pequena', label: 'Cruz Pequeña' },
  { value: 'letra_x', label: 'Letra X' },
];

export default function ModosJuegoForm({ modos, onChange }) {
  const agregarModo = () => {
    onChange([...modos, { tipo: 'linea_horizontal', nombre: 'Línea', premio: 0, completado: false }]);
  };

  const eliminarModo = (index) => {
    onChange(modos.filter((_, i) => i !== index));
  };

  const actualizarModo = (index, campo, valor) => {
    const nuevosModos = [...modos];
    nuevosModos[index] = { ...nuevosModos[index], [campo]: valor };
    onChange(nuevosModos);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Modos de Juego</Label>
        <Button type="button" variant="outline" size="sm" onClick={agregarModo}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Modo
        </Button>
      </div>

      {modos.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          No hay modos de juego. Agrega al menos uno.
        </p>
      ) : (
        <div className="space-y-3">
          {modos.map((modo, index) => (
            <Card key={index} className="border border-slate-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={modo.tipo}
                      onValueChange={(value) => actualizarModo(index, 'tipo', value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_MODO.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Nombre</Label>
                    <Input
                      value={modo.nombre}
                      onChange={(e) => actualizarModo(index, 'nombre', e.target.value)}
                      placeholder="Ej: Primera Línea"
                      className="h-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Premio ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={modo.premio}
                        onChange={(e) => actualizarModo(index, 'premio', parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => eliminarModo(index)}
                        className="h-9 w-9"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}