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
    <div className="bg-white border-2 border-blue-300 rounded-lg shadow-md overflow-hidden w-full max-w-[160px]">
      {/* Header compacto */}
      <div className="bg-blue-500 text-white p-2">
        <div className="text-center text-xs font-bold mb-1">BINGO MANÍA</div>
        {carton?.numero_carton && (
          <div className="text-center text-xs mb-1">Cartón No. {carton.numero_carton}</div>
        )}
        <div className="grid grid-cols-5 gap-0.5 text-center">
          {letras.map((letra) => (
            <div key={letra} className="font-bold text-xs">{letra}</div>
          ))}
        </div>
      </div>

      {/* Grid compacto */}
      <div className="p-1.5 bg-blue-50">
        <div className="grid grid-cols-5 gap-0.5">
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
                      "aspect-square rounded font-bold text-xs transition-all duration-150 flex items-center justify-center",
                      esCentro && "bg-blue-400 text-white",
                      !esCentro && !marcado && "bg-yellow-100 text-slate-800",
                      !esCentro && marcado && "bg-blue-400 text-white",
                      esUltima && "ring-1 ring-yellow-400"
                    )}
                  >
                    {esCentro ? '●' : numero}
                  </button>
                );
              })
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}