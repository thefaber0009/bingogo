import React from 'react';
import { cn } from '@/lib/utils';

export default function CartonBingo({ carton, marcados = [], onMarcar, autoMarcar = false, modoSeleccionado = null, ultimoNumero = null }) {
  const letras = ['B', 'I', 'N', 'G', 'O'];

  const numeros = Array.isArray(carton?.numeros?.[0]) 
    ? carton.numeros 
    : carton?.numeros || [];

  const obtenerLetra = (numero) => {
    if (numero <= 15) return 'B';
    if (numero <= 30) return 'I';
    if (numero <= 45) return 'N';
    if (numero <= 60) return 'G';
    return 'O';
  };

  const getLetrasAlMarcar = (modo) => {
    const modoMap = {
      'Marco Grande': ['B', 'I'],
      'Letra H': ['B', 'I'],
      'Letra L': ['B', 'O'],
      'Letra T': ['B', 'I', 'N', 'G'],
      'Letra X': ['B', 'G', 'N', 'O'],
      '4 Esquinas': ['B', 'O'],
      'Casa Llena': ['B', 'I', 'N', 'G', 'O'],
      '1 Línea': ['B', 'I', 'N', 'G', 'O'],
      '2 Líneas': ['B', 'I', 'N', 'G', 'O'],
      'Zig-Zag': ['B', 'I', 'N', 'G', 'O'],
      'Pirámide': ['B', 'I', 'N', 'G', 'O']
    };
    return modoMap[modo] || [];
  };

  const isNumeroMarcado = (numero, columna) => {
    if (numero === 0) return true;
    const letra = obtenerLetra(numero);
    const letrasAlMarcar = getLetrasAlMarcar(modoSeleccionado);
    return marcados.includes(numero) && letrasAlMarcar.includes(letra);
  };

  const handleClickCelda = (numero) => {
    if (numero === 0) return;
    if (autoMarcar) return;
    if (onMarcar) onMarcar(numero);
  };

  return (
    <div className="bg-white border-2 border-blue-400 rounded-xl shadow-lg overflow-hidden w-full max-w-xs">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3">
        <div className="text-center text-sm font-bold mb-2">BINGO MANÍA</div>
        <div className="text-center text-xs mb-2">
          {carton?.numero_carton && <span>Cartón No. {carton.numero_carton}</span>}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {letras.map((letra) => (
            <div key={letra} className="text-center font-bold text-sm">
              {letra}
            </div>
          ))}
        </div>
      </div>

      {/* Grid de números */}
      <div className="p-3 bg-blue-50">
        <div className="grid grid-cols-5 gap-1">
          {numeros.length > 0 ? (
            numeros.map((fila, i) => 
              (Array.isArray(fila) ? fila : []).map((numero, j) => {
                const esCentro = i === 2 && j === 2;
                const marcado = isNumeroMarcado(numero, j);
                const esUltima = numero === ultimoNumero;

                return (
                  <button
                    key={`${i}-${j}`}
                    onClick={() => handleClickCelda(numero)}
                    disabled={esCentro}
                    className={cn(
                      "aspect-square rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center relative",
                      esCentro && "bg-blue-400 text-white cursor-not-allowed",
                      !esCentro && !marcado && "bg-amber-100 text-slate-900 hover:bg-amber-200 cursor-pointer",
                      !esCentro && marcado && "bg-blue-400 text-white shadow-lg",
                      esUltima && "ring-2 ring-yellow-400"
                    )}
                  >
                    {esCentro ? '●' : numero}
                  </button>
                );
              })
            )
          ) : (
            <div className="col-span-5 text-center py-4 text-slate-500 text-xs">
              Sin números
            </div>
          )}
        </div>
      </div>

      {/* Footer con modo */}
      {modoSeleccionado && (
        <div className="bg-blue-100 px-3 py-2 text-center text-xs font-semibold text-blue-700 border-t border-blue-200">
          Modo: {modoSeleccionado}
        </div>
      )}
    </div>
  );
}