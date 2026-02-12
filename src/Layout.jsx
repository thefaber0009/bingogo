import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  LayoutDashboard, 
  GamepadIcon, 
  Users, 
  Trophy, 
  Bell,
  LogOut,
  PlayCircle,
  User
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: 'Home' },
    { name: 'Partidas', icon: GamepadIcon, path: 'Partidas' },
    { name: 'En Vivo', icon: PlayCircle, path: 'PartidaEnVivo' },
    { name: 'Usuarios', icon: Users, path: 'Usuarios' },
    { name: 'Premios', icon: Trophy, path: 'Premios' },
    { name: 'Notificaciones', icon: Bell, path: 'Notificaciones' },
  ];

  const userItems = [
    { name: 'Mi Perfil', icon: User, path: 'Perfil' },
  ];

  // Páginas del cliente sin dashboard
  const clientPages = ['Lobby', 'ComprarCartones', 'MisCartones', 'SalaBingo'];
  if (clientPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 shadow-xl z-50">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69811affc30258284f5a5643/a24656e95_image.png" alt="BingoGo Logo" className="w-12 h-12 rounded-2xl" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  BingoManía
                </h1>
                <p className="text-xs text-slate-500 font-medium">Panel Administrativo</p>
              </div>
            </div>

          <nav className="space-y-6">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.path;
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-6 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4">
                Cuenta
              </p>
              <div className="space-y-2">
                {userItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={createPageUrl(item.path)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-200 bg-slate-50">
          {user && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.full_name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
                  <p className="text-xs text-slate-500">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 min-h-screen flex flex-col">
        <div className="p-8 flex-1">
          {children}
        </div>

        {/* Footer */}
        <footer className="bg-slate-800 text-slate-300 py-6 px-8 text-center border-t border-slate-700">
          <p className="text-sm font-medium text-white">Copyright © 2026 BingoManía. Todos los derechos reservados.</p>
          <p className="text-xs mt-1">Sitio creado por: 360 Ingenierías</p>
        </footer>
      </main>
      </div>
      );
      }