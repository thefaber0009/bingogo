import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function CartonBingo({ carton, marcados = [], onMarcar, autoMarcar = false, modoSeleccionado = null, ultimoNumero = null }) {
  const letras = ['B', 'I', 'N', 'G', 'O'];
  
  // Convertir el array plano a matriz 5x5 si es necesario
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
    if (numero === 0) return true; // Siempre marcar centro
    const letra = obtenerLetra(numero);
    const letrasAlMarcar = getLetrasAlMarcar(modoSeleccionado);
    
    // Solo marcar si está en marcados Y está en las letras del modo
    return marcados.includes(numero) && letrasAlMarcar.includes(letra);
  };

  const handleClickCelda = (numero) => {
    if (numero === 0) return; // No marcar el centro libre
    if (autoMarcar) return; // No permitir marcado manual en modo auto
    if (onMarcar) onMarcar(numero);
  };

  return (
    <Card className="border-2 border-slate-300 shadow-2xl overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
          <div className="text-center mb-2">
            {modoSeleccionado && (
              <span className="text-white text-xs font-bold bg-black/20 px-2 py-1 rounded">
                Modo: {modoSeleccionado}
              </span>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {letras.map((letra, idx) => {
              const letrasAlMarcar = getLetrasAlMarcar(modoSeleccionado);
              const debeMarcar = letrasAlMarcar.includes(letra);
              return (
                <div 
                  key={letra} 
                  className={`text-center rounded-lg py-1 ${debeMarcar ? 'bg-white/20' : ''}`}
                >
                  <span className="text-white font-bold text-2xl">{letra}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 bg-white">
          <div className="grid grid-cols-5 gap-2">
            {numeros.length > 0 ? (
              numeros.map((fila, i) => 
                (Array.isArray(fila) ? fila : []).map((numero, j) => {
                  const esCentro = i === 2 && j === 2;
                  const marcado = isNumeroMarcado(numero);
                  
                  return (
                    <button
                      key={`${i}-${j}`}
                      onClick={() => handleClickCelda(numero)}
                      disabled={esCentro}
                      className={cn(
                        "aspect-square rounded-lg font-bold text-lg transition-all duration-200",
                        "flex items-center justify-center",
                        esCentro && "bg-amber-100 text-amber-600 cursor-not-allowed",
                        !esCentro && !marcado && "bg-slate-50 hover:bg-slate-100 text-slate-900 hover:scale-105 cursor-pointer",
                        !esCentro && marcado && "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg scale-95"
                      )}
                    >
                      {esCentro ? '★' : numero}
                    </button>
                  );
                })
              )
            ) : (
              <div className="col-span-5 text-center py-8 text-slate-500">
                No hay números en el cartón
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}