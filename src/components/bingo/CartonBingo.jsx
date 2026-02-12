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
    <div className="bg-white border-2 border-green-400 rounded-lg shadow-md overflow-hidden w-full max-w-xs">
      {/* Status Badge */}
      <div className="bg-green-400 text-white text-center text-xs font-bold py-1">
        ✓ Vendido
      </div>

      {/* Header con Modo */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 text-center">
        <div className="text-xs font-bold">Modo: Letra L</div>
        <div className="grid grid-cols-5 gap-1 mt-2">
          {letras.map((letra) => (
            <div key={letra} className="font-bold text-base">{letra}</div>
          ))}
        </div>
      </div>

      {/* Números en filas */}
      <div className="p-3 bg-white">
        <div className="space-y-1.5">
          {numeros.length > 0 ? (
            numeros.map((fila, i) => {
              const arrayFila = Array.isArray(fila) ? fila : [];
              return (
                <div key={i} className="flex gap-1 justify-between text-xs font-semibold">
                  {arrayFila.map((numero, j) => {
                    const esCentro = i === 2 && j === 2;
                    const marcado = isNumeroMarcado(numero, j);

                    return (
                      <span
                        key={`${i}-${j}`}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center rounded",
                          esCentro && "bg-gray-300 text-white",
                          !esCentro && !marcado && "text-slate-700",
                          !esCentro && marcado && "bg-blue-500 text-white rounded-full"
                        )}
                      >
                        {esCentro ? '★' : numero}
                      </span>
                    );
                  })}
                </div>
              );
            })
          ) : null}
        </div>
      </div>
    </div>
  );
}