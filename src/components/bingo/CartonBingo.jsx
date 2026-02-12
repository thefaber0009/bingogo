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
    <div className="bg-white border-2 border-blue-400 rounded-lg shadow-lg overflow-hidden w-full">
      {/* Header */}
      <div className="bg-white border-b-2 border-blue-400 p-2.5 text-center">
        <div className="text-blue-600 font-bold text-sm mb-1">BINGO MANÍA</div>
        <div className="text-xs text-slate-600 font-semibold">Cartón No. <span className="text-blue-600 font-bold">1</span></div>
      </div>

      {/* Letras */}
      <div className="grid grid-cols-5 gap-0.5 px-2 pt-2">
        {letras.map((letra) => (
          <div key={letra} className="text-center text-xs font-bold text-blue-600">
            {letra}
          </div>
        ))}
      </div>

      {/* Grid de números estilo bingo */}
      <div className="p-2 bg-white space-y-0.5">
        {numeros.length > 0 ? (
          numeros.map((fila, i) => {
            const arrayFila = Array.isArray(fila) ? fila : [];
            return (
              <div key={i} className="grid grid-cols-5 gap-0.5">
                {arrayFila.map((numero, j) => {
                  const esCentro = i === 2 && j === 2;
                  const marcado = isNumeroMarcado(numero, j);

                  return (
                    <div
                      key={`${i}-${j}`}
                      className={cn(
                        "aspect-square flex items-center justify-center rounded text-xs font-bold transition-all",
                        esCentro && "bg-gray-300 text-white relative",
                        !esCentro && !marcado && "bg-yellow-100 text-slate-800",
                        !esCentro && marcado && "bg-yellow-100 text-slate-800 ring-2 ring-blue-500"
                      )}
                    >
                      {esCentro ? (
                        <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                      ) : (
                        numero
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        ) : null}
      </div>
    </div>
  );
}