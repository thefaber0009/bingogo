import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Play, Square, RotateCcw } from 'lucide-react';

export default function PanelAdminPartida({ partida, open, onOpenChange }) {
  const [numerosSorteados, setNumerosSorteados] = useState([]);
  const [sorteando, setSorteando] = useState(false);
  const [tiempoSorteo, setTiempoSorteo] = useState(5);
  const [modoSeleccionado, setModoSeleccionado] = useState('Letra L');
  const [autoSort, setAutoSort] = useState(false);
  const [ultimoNumero, setUltimoNumero] = useState(null);

  const NUMEROS_BINGO = {
    B: Array.from({ length: 15 }, (_, i) => i + 1),
    I: Array.from({ length: 15 }, (_, i) => i + 16),
    N: Array.from({ length: 15 }, (_, i) => i + 31),
    G: Array.from({ length: 15 }, (_, i) => i + 46),
    O: Array.from({ length: 15 }, (_, i) => i + 61),
  };

  const sacarNumero = () => {
    const disponibles = [];
    Object.values(NUMEROS_BINGO).flat().forEach(num => {
      if (!numerosSorteados.includes(num)) {
        disponibles.push(num);
      }
    });
    
    if (disponibles.length > 0) {
      const nuevoNumero = disponibles[Math.floor(Math.random() * disponibles.length)];
      setNumerosSorteados([...numerosSorteados, nuevoNumero]);
      setUltimoNumero(nuevoNumero);
    }
  };

  const iniciarSorteoAutomatico = () => {
    setSorteando(true);
    setAutoSort(true);
  };

  useEffect(() => {
    if (!sorteando || !autoSort) return;

    const intervalo = setInterval(() => {
      sacarNumero();
    }, tiempoSorteo * 1000);

    return () => clearInterval(intervalo);
  }, [sorteando, autoSort, numerosSorteados, tiempoSorteo]);

  const detenerSorteo = () => {
    setSorteando(false);
    setAutoSort(false);
  };

  const reiniciar = () => {
    setNumerosSorteados([]);
    setUltimoNumero(null);
    setSorteando(false);
    setAutoSort(false);
  };

  const obtenerLetra = (numero) => {
    if (numero <= 15) return 'B';
    if (numero <= 30) return 'I';
    if (numero <= 45) return 'N';
    if (numero <= 60) return 'G';
    return 'O';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-slate-100 p-0">
        <DialogHeader className="bg-white border-b p-4">
          <DialogTitle className="text-2xl">Panel de Administración - {partida.nombre}</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Controles */}
          <div className="bg-white rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Tiempo entre sorteos (s)</label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={tiempoSorteo}
                  onChange={(e) => setTiempoSorteo(parseInt(e.target.value))}
                  className="h-8"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Modo de Juego</label>
                <Select value={modoSeleccionado} onValueChange={setModoSeleccionado}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {partida.modos_juego?.map((modo, idx) => (
                      <SelectItem key={idx} value={modo.nombre}>{modo.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 items-end">
                <Button size="sm" onClick={sacarNumero} className="flex-1 h-8 bg-yellow-500 hover:bg-yellow-600 text-black">
                  Sacar nuevo número
                </Button>
              </div>
              <div className="flex gap-2 items-end">
                <Button 
                  size="sm" 
                  onClick={autoSort ? detenerSorteo : iniciarSorteoAutomatico}
                  className={`flex-1 h-8 ${autoSort ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                  {autoSort ? 'Detener' : 'Automático'}
                </Button>
                <Button 
                  size="sm" 
                  onClick={reiniciar}
                  className="h-8 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Números Sorteados */}
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm font-semibold text-slate-700 mb-3">Números sorteados: {numerosSorteados.length}</div>
            <div className="flex items-center gap-4 mb-4">
              {ultimoNumero && (
                <div className="flex items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-blue-800">
                    {ultimoNumero}
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-slate-900 text-lg">Última bola</span>
                  </div>
                </div>
              )}
            </div>

            {/* Grilla de Números BINGO */}
            <div className="space-y-2">
              {Object.entries(NUMEROS_BINGO).map(([letra, numeros]) => (
                <div key={letra} className="flex gap-1">
                  <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center font-bold rounded">
                    {letra}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {numeros.map((num) => (
                      <button
                        key={num}
                        className={`w-12 h-12 rounded border-2 font-semibold transition-all ${
                          numerosSorteados.includes(num)
                            ? 'bg-blue-200 border-blue-600 text-blue-900 scale-95'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info del Juego */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-xs text-slate-600 font-semibold">Números sorteados</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{numerosSorteados.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-xs text-slate-600 font-semibold">Cartones vendidos</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{partida.cartones_vendidos || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-xs text-slate-600 font-semibold">Ingresos</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">${((partida.cartones_vendidos || 0) * partida.precio_carton).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-xs text-slate-600 font-semibold">Estado</p>
              <p className={`text-xl font-bold mt-2 ${partida.estado === 'en_curso' ? 'text-green-600' : 'text-slate-600'}`}>
                {partida.estado === 'en_curso' ? 'Activa' : 'Inactiva'}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}