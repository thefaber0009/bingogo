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
  const coloresLetra = { B: 'bg-blue-600', I: 'bg-purple-600', N: 'bg-pink-600', G: 'bg-orange-600', O: 'bg-red-600' };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {ultimasBalotas.map((numero, idx) => {
        const letra = obtenerLetra(numero);
        const isUltima = numero === ultimoNumero;
        return (
          <div
            key={`${numero}-${idx}`}
            className={`flex-shrink-0 w-20 h-20 rounded-full flex flex-col items-center justify-center font-bold text-white transition-all transform ${
              isUltima ? 'scale-110 ring-4 ring-yellow-400' : 'scale-100'
            } ${coloresLetra[letra]}`}
          >
            <span className="text-xs opacity-90">{letra}</span>
            <span className="text-2xl">{numero}</span>
          </div>
        );
      })}
    </div>
  );
}