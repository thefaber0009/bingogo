import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Circle,
  Trophy,
  Users,
  ArrowLeft,
  CheckCircle,
  ShoppingCart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CartonBingo from '../components/bingo/CartonBingo';

export default function SalaBingo() {
  const [marcados, setMarcados] = useState([]);
  const [autoMarcar, setAutoMarcar] = useState(true);
  const [hayBingo, setHayBingo] = useState(false);
  
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const partidaId = urlParams.get('partida');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partida } = useQuery({
    queryKey: ['partida', partidaId],
    queryFn: () => base44.entities.Partida.filter({ id: partidaId }).then(r => r[0]),
    enabled: !!partidaId,
  });

  const { data: cartones = [] } = useQuery({
    queryKey: ['misCartones', partidaId, user?.id],
    queryFn: () => base44.entities.Carton.filter({ 
      partida_id: partidaId,
      jugador_id: user.id 
    }),
    enabled: !!partidaId && !!user?.id,
  });

  const { data: bolas = [] } = useQuery({
    queryKey: ['bolas', partidaId],
    queryFn: () => base44.entities.BolaCantada.filter({ partida_id: partidaId }, 'orden'),
    enabled: !!partidaId,
    refetchInterval: 2000,
  });

  const miCarton = cartones[0];

  // Función para generar números aleatorios de bingo
  const generarCarton = () => {
    const carton = [];
    const rangos = [
      [1, 15],   // B
      [16, 30],  // I
      [31, 45],  // N
      [46, 60],  // G
      [61, 75]   // O
    ];

    for (let col = 0; col < 5; col++) {
      const columna = [];
      const [min, max] = rangos[col];
      const numerosDisponibles = Array.from({ length: max - min + 1 }, (_, i) => i + min);
      
      for (let row = 0; row < 5; row++) {
        if (col === 2 && row === 2) {
          columna.push(0); // Centro libre
        } else {
          const idx = Math.floor(Math.random() * numerosDisponibles.length);
          columna.push(numerosDisponibles.splice(idx, 1)[0]);
        }
      }
      carton.push(columna);
    }

    // Transponer para tener filas en lugar de columnas
    return carton[0].map((_, i) => carton.map(col => col[i]));
  };

  const crearCartonMutation = useMutation({
    mutationFn: async () => {
      const nuevoCarton = {
        jugador_id: user.id,
        partida_id: partidaId,
        numeros: generarCarton(),
        estado: 'activo',
        comprado: true,
        marcados: []
      };
      return base44.entities.Carton.create(nuevoCarton);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['misCartones', partidaId, user?.id]);
    }
  });

  // Auto-marcar números cuando salen bolas
  useEffect(() => {
    if (autoMarcar && bolas.length > 0) {
      const numerosBolas = bolas.map(b => b.numero);
      setMarcados(numerosBolas);
    }
  }, [bolas, autoMarcar]);

  // Verificar si hay BINGO
  useEffect(() => {
    if (!miCarton || marcados.length < 5) return;
    
    const numeros = miCarton.numeros || [];
    if (!Array.isArray(numeros[0])) return;

    // Verificar líneas horizontales
    for (let fila of numeros) {
      const todosMarcados = fila.every(n => n === 0 || marcados.includes(n));
      if (todosMarcados) {
        setHayBingo(true);
        return;
      }
    }

    // Verificar líneas verticales
    for (let col = 0; col < 5; col++) {
      const todosMarcados = numeros.every(fila => {
        const n = fila[col];
        return n === 0 || marcados.includes(n);
      });
      if (todosMarcados) {
        setHayBingo(true);
        return;
      }
    }

    // Verificar diagonales
    const diagonal1 = numeros.every((fila, i) => {
      const n = fila[i];
      return n === 0 || marcados.includes(n);
    });
    
    const diagonal2 = numeros.every((fila, i) => {
      const n = fila[4 - i];
      return n === 0 || marcados.includes(n);
    });

    if (diagonal1 || diagonal2) {
      setHayBingo(true);
    }
  }, [marcados, miCarton]);

  const handleMarcar = (numero) => {
    if (marcados.includes(numero)) {
      setMarcados(marcados.filter(n => n !== numero));
    } else {
      setMarcados([...marcados, numero]);
    }
  };

  const declararBingo = () => {
    alert('¡BINGO! Se notificará al administrador para validar tu victoria.');
  };

  if (!partidaId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">No se especificó una partida</p>
            <Link to={createPageUrl('Lobby')}>
              <Button className="mt-4">Volver al Lobby</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!miCarton) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="py-12 text-center">
            <Trophy className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Únete a la partida!</h2>
            <p className="text-slate-600 mb-2">{partida?.nombre}</p>
            <p className="text-sm text-slate-500 mb-6">
              Costo del cartón: <span className="font-bold text-green-600">${partida?.monto_entrada?.toFixed(2)}</span>
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => crearCartonMutation.mutate()}
                disabled={crearCartonMutation.isLoading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600"
                size="lg"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {crearCartonMutation.isLoading ? 'Creando...' : 'Comprar Cartón'}
              </Button>
              <Link to={createPageUrl('Lobby')}>
                <Button variant="outline" size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Lobby')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{partida?.nombre}</h1>
              <p className="text-slate-600">Sala de Bingo en Vivo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setAutoMarcar(!autoMarcar)}
              className={autoMarcar ? 'bg-green-50 border-green-200' : ''}
            >
              <CheckCircle className={`w-4 h-4 mr-2 ${autoMarcar ? 'text-green-600' : ''}`} />
              {autoMarcar ? 'Marcado Automático' : 'Marcado Manual'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cartón Principal */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <CartonBingo 
                carton={miCarton}
                marcados={marcados}
                onMarcar={handleMarcar}
                autoMarcar={autoMarcar}
              />
            </div>
            
            {hayBingo && (
              <Card className="border-0 shadow-xl bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-12 h-12 text-white mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-white mb-2">¡BINGO!</h2>
                  <p className="text-white/90 mb-4">¡Has completado un patrón ganador!</p>
                  <Button 
                    size="lg"
                    onClick={declararBingo}
                    className="bg-white text-orange-600 hover:bg-slate-50"
                  >
                    Declarar BINGO
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Bolas Cantadas */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Circle className="w-5 h-5 text-indigo-600" />
                  Bolas Cantadas ({bolas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bolas.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
                      <p className="text-xs text-white/70 mb-1">Última bola</p>
                      <div className="flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                          <span className="text-3xl font-bold text-indigo-600">
                            {bolas[bolas.length - 1]?.numero}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {bolas.slice().reverse().map((bola, idx) => (
                          <div
                            key={bola.id}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              idx === 0 
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white scale-110 shadow-lg' 
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {bola.numero}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">
                    Esperando que comience el sorteo...
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Info de la Partida */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Premio</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${partida?.premio_total?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Estado</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {partida?.estado}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}