import React from 'react';
import { cn } from '@/lib/utils';

export default function CartonBingo({ carton, marcados = [], onMarcar, autoMarcar = false, modoSeleccionado = null, ultimoNumero = null, numeroCarton = 1 }) {
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
      <div className="px-2.5 pb-2 pt-1.5 bg-white space-y-0.5">
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
                        "aspect-square flex items-center justify-center font-bold transition-all text-sm",
                        esCentro && "bg-white",
                        !esCentro && "bg-yellow-100 text-slate-900 rounded",
                        !esCentro && marcado && "ring-2 ring-blue-500"
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
          })
        ) : null}
      </div>

      {/* Botones */}
      <div className="flex gap-2 px-2.5 pb-2.5 pt-1.5">
        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs transition-all">
          Seleccionar
        </button>
        <button className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded text-xs transition-all">
          Verificar
        </button>
      </div>
    </div>
  );
}