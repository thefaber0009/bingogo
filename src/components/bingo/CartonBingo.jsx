import React from 'react';
import { cn } from '@/lib/utils';

export default function CartonBingo({ carton, marcados = [], onMarcar, autoMarcar = false, modoSeleccionado = null, ultimoNumero = null, numeroCarton = 1, mostrarBotones = false }) {
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

  // Mapeo de modos a posiciones específicas en el grid (fila, columna)
  const getModoPositiones = (modo) => {
    const modoMap = {
      'Letra L': [[0,0], [1,0], [2,0], [3,0], [4,0], [4,1], [4,2], [4,3], [4,4]],
      'Letra H': [[0,0], [1,0], [2,0], [3,0], [4,0], [0,4], [1,4], [2,4], [3,4], [4,4]],
      'Letra T': [[0,0], [0,1], [0,2], [0,3], [0,4], [1,2], [2,2], [3,2], [4,2]],
      'Letra X': [[0,0], [1,1], [2,2], [3,3], [4,4], [0,4], [1,3], [3,1], [4,0]],
      '4 Esquinas': [[0,0], [0,4], [4,0], [4,4]],
      'Casa Llena': [[0,0], [0,1], [0,2], [0,3], [0,4], [1,0], [1,1], [1,2], [1,3], [1,4], [2,0], [2,1], [2,2], [2,3], [2,4], [3,0], [3,1], [3,2], [3,3], [3,4], [4,0], [4,1], [4,2], [4,3], [4,4]]
    };
    return modoMap[modo] || [];
  };

  const perteneceModo = (fila, columna) => {
    if (!modoSeleccionado) return false;
    const posiciones = getModoPositiones(modoSeleccionado);
    return posiciones.some(([f, c]) => f === fila && c === columna);
  };

  const isNumeroMarcado = (numero, fila, columna) => {
    if (numero === 0) return true;
    if (!marcados.includes(numero)) return false;
    if (!modoSeleccionado) return true;
    return perteneceModo(fila, columna);
  };

  const handleClickCelda = (numero) => {
    if (numero === 0) return;
    if (autoMarcar) return;
    if (onMarcar) onMarcar(numero);
  };

  return (
    <div className="bg-white border-4 border-blue-500 rounded-2xl shadow-xl overflow-hidden w-full max-w-sm">
      {/* Header */}
      <div className="bg-white border-b-2 border-blue-300 p-3 text-center">
        <div className="text-blue-600 font-bold text-lg mb-0.5">BINGO MANÍA</div>
        <div className="text-xs text-slate-500 font-semibold">Cartón No. <span className="text-red-600 font-bold text-sm">{numeroCarton}</span></div>
      </div>

      {/* Letras */}
      <div className="grid grid-cols-5 gap-1 px-3 pt-2 pb-1">
        {letras.map((letra) => (
          <div key={letra} className="text-center text-xs font-bold text-blue-600">
            {letra}
          </div>
        ))}
      </div>

      {/* Grid de números estilo bingo */}
      <div className="relative px-2.5 pb-2 pt-1.5 bg-white space-y-0.5">
        {numeros.length > 0 ? (
          <>
            {numeros.map((fila, i) => {
              const arrayFila = Array.isArray(fila) ? fila : [];
              return (
                <div key={i} className="grid grid-cols-5 gap-0.5">
                  {arrayFila.map((numero, j) => {
                    const esCentro = i === 2 && j === 2;
                    const perteneceAlModo = perteneceModo(i, j);
                    const marcado = isNumeroMarcado(numero, i, j);

                    return (
                      <div
                        key={`${i}-${j}`}
                        className={cn(
                          "aspect-square flex items-center justify-center font-bold transition-all text-sm rounded",
                          esCentro && "bg-white",
                          !esCentro && !modoSeleccionado && "bg-gray-100 text-gray-600 border-2 border-dashed border-gray-300",
                          !esCentro && modoSeleccionado && perteneceAlModo && "bg-yellow-100 text-slate-900 border-2 border-dashed border-yellow-300",
                          !esCentro && modoSeleccionado && !perteneceAlModo && "bg-gray-100 text-gray-600 border-2 border-dashed border-gray-300",
                          !esCentro && marcado && "border-blue-500"
                        )}
                      >
                        {esCentro ? (
                          <div className="w-4 h-4 bg-cyan-400 rounded-full"></div>
                        ) : (
                          numero
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        ) : null}
      </div>

      {/* Botones - Solo para admin */}
      {mostrarBotones && (
        <div className="flex gap-2 px-2.5 pb-2.5 pt-1.5">
          <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs transition-all">
            Seleccionar
          </button>
          <button className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded text-xs transition-all">
            Verificar
          </button>
        </div>
      )}
    </div>
  );
}