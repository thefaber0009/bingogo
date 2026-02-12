import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Play, Square, RotateCcw, Ticket } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import CartonBingo from '../bingo/CartonBingo';

export default function PanelAdminPartida({ partida, open, onOpenChange }) {
  const [numerosSorteados, setNumerosSorteados] = useState([]);
  const [sorteando, setSorteando] = useState(false);
  const [tiempoSorteo, setTiempoSorteo] = useState(5);
  const [modoSeleccionado, setModoSeleccionado] = useState('Letra L');
  const [autoSort, setAutoSort] = useState(false);
  const [ultimoNumero, setUltimoNumero] = useState(null);
  const [mostrarCartones, setMostrarCartones] = useState(false);

  const { data: cartonesSala = [] } = useQuery({
    queryKey: ['cartonesSala', partida?.id],
    queryFn: () => base44.entities.Carton.filter({ partida_id: partida.id }),
    enabled: !!partida?.id && open,
    refetchInterval: 5000,
  });

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
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Panel de Administración - {partida.nombre}</DialogTitle>
            <Button 
              onClick={() => onOpenChange(false)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Salir
            </Button>
          </div>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-xs text-slate-600 font-semibold">Números sorteados</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{numerosSorteados.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-xs text-slate-600 font-semibold">Cartones totales</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{partida.cantidad_total_cartones || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-xs text-slate-600 font-semibold">Cartones vendidos</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{cartonesSala.filter(c => c.comprado).length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-xs text-slate-600 font-semibold">Ingresos</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">${(cartonesSala.filter(c => c.comprado).length * partida.precio_carton).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-xs text-slate-600 font-semibold">Estado</p>
              <p className={`text-xl font-bold mt-2 ${partida.estado === 'en_curso' ? 'text-green-600' : 'text-slate-600'}`}>
                {partida.estado === 'en_curso' ? 'Activa' : 'Inactiva'}
              </p>
            </div>
          </div>

          {/* Cartones de la Sala */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900">Cartones de esta Sala</h3>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {cartonesSala.length} / {partida.cantidad_total_cartones}
                </span>
              </div>
              <Button
                onClick={() => setMostrarCartones(!mostrarCartones)}
                variant="outline"
                size="sm"
              >
                {mostrarCartones ? 'Ocultar' : 'Ver'} Cartones
              </Button>
            </div>

            {mostrarCartones && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                {cartonesSala.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No hay cartones generados para esta sala</p>
                  </div>
                ) : (
                  cartonesSala
                    .sort((a, b) => a.numero_carton - b.numero_carton)
                    .map((carton) => (
                      <div key={carton.id} className={`border-2 rounded-lg p-2 ${
                        carton.comprado ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-white'
                      }`}>
                        <div className="text-xs font-bold text-center mb-1 flex items-center justify-between">
                          <span className="text-indigo-600">#{carton.numero_carton}</span>
                          {carton.comprado && (
                            <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">Vendido</span>
                          )}
                        </div>
                        <div className="scale-75 origin-top">
                          <CartonBingo
                            carton={carton}
                            marcados={numerosSorteados}
                            onMarcar={() => {}}
                            autoMarcar={false}
                          />
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}