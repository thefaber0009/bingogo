import React from 'react';

export default function BolasDisplay({ numerosSorteados = [], ultimoNumero = null }) {
  const obtenerLetra = (numero) => {
    if (numero <= 15) return 'B';
    if (numero <= 30) return 'I';
    if (numero <= 45) return 'N';
    if (numero <= 60) return 'G';
    return 'O';
  };

  // Mostrar las últimas 5 balotas
  const ultimasBalotas = numerosSorteados.slice(-5);
  const coloresLetra = { 
    B: 'bg-blue-600', 
    I: 'bg-indigo-600', 
    N: 'bg-pink-500', 
    G: 'bg-orange-500', 
    O: 'bg-red-600' 
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 justify-center">
      {ultimasBalotas.map((numero, idx) => {
        const letra = obtenerLetra(numero);
        const isUltima = numero === ultimoNumero;
        return (
          <div
            key={`${numero}-${idx}`}
            className={`flex-shrink-0 w-14 h-14 rounded-full flex flex-col items-center justify-center font-bold text-white transition-all transform shadow-lg ${
              isUltima ? 'scale-125 ring-4 ring-yellow-300 shadow-yellow-400/50' : 'scale-100'
            } ${coloresLetra[letra]}`}
          >
            <span className="text-xs font-bold opacity-95">{letra}</span>
            <span className="text-lg font-bold">{numero}</span>
          </div>
        );
      })}
    </div>
  );
}