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
    <div className="bg-white border-2 border-green-400 rounded-lg shadow-md overflow-hidden w-full">
      {/* Status Badge */}
      <div className="bg-green-500 text-white text-center text-xs font-bold py-1">
        ✓ Vendido
      </div>

      {/* Header con Modo */}
      <div className="bg-purple-500 text-white p-2 text-center">
        <div className="text-xs font-bold mb-1.5">MODO: Letra L</div>
        <div className="grid grid-cols-5 gap-0.5">
          {letras.map((letra) => (
            <div key={letra} className="font-bold text-sm bg-purple-600 py-0.5 rounded-sm">{letra}</div>
          ))}
        </div>
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
                        "aspect-square flex items-center justify-center rounded text-sm font-semibold transition-all border",
                        esCentro && "bg-gray-300 text-white border-gray-400",
                        !esCentro && !marcado && "bg-white text-slate-800 border-slate-200",
                        !esCentro && marcado && "bg-blue-500 text-white border-blue-600 ring-1 ring-blue-400"
                      )}
                    >
                      {esCentro ? '★' : numero}
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