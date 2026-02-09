import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Tag } from 'lucide-react';

export default function CombosForm({ combos, onChange, precioCarton }) {
  const agregarCombo = () => {
    onChange([...combos, { cantidad: 2, precio: 0, descuento: 0 }]);
  };

  const eliminarCombo = (index) => {
    onChange(combos.filter((_, i) => i !== index));
  };

  const actualizarCombo = (index, campo, valor) => {
    const nuevosCombos = [...combos];
    nuevosCombos[index] = { ...nuevosCombos[index], [campo]: valor };
    
    // Auto-calcular precio o descuento
    if (campo === 'cantidad' || campo === 'descuento') {
      const cantidad = campo === 'cantidad' ? valor : nuevosCombos[index].cantidad;
      const descuento = campo === 'descuento' ? valor : nuevosCombos[index].descuento;
      const precioBase = cantidad * (precioCarton || 0);
      nuevosCombos[index].precio = precioBase * (1 - descuento / 100);
    }
    
    onChange(nuevosCombos);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Combos de Cartones</Label>
        <Button type="button" variant="outline" size="sm" onClick={agregarCombo}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Combo
        </Button>
      </div>

      {combos.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          No hay combos. Los combos ofrecen descuentos al comprar múltiples cartones.
        </p>
      ) : (
        <div className="space-y-3">
          {combos.map((combo, index) => (
            <Card key={index} className="border border-slate-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <Label className="text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      min="2"
                      value={combo.cantidad}
                      onChange={(e) => actualizarCombo(index, 'cantidad', parseInt(e.target.value) || 2)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Descuento (%)</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={combo.descuento}
                      onChange={(e) => actualizarCombo(index, 'descuento', parseFloat(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Precio Final ($)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={combo.precio}
                        onChange={(e) => actualizarCombo(index, 'precio', parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => eliminarCombo(index)}
                        className="h-9 w-9"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Tag className="w-4 h-4" />
                    Ahorro: ${((combo.cantidad * (precioCarton || 0)) - combo.precio).toFixed(2)}
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