/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import ComprarCartones from './pages/ComprarCartones';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Notificaciones from './pages/Notificaciones';
import PartidaEnVivo from './pages/PartidaEnVivo';
import Partidas from './pages/Partidas';
import Perfil from './pages/Perfil';
import Premios from './pages/Premios';
import SalaBingo from './pages/SalaBingo';
import Usuarios from './pages/Usuarios';
import MisCartones from './pages/MisCartones';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ComprarCartones": ComprarCartones,
    "Home": Home,
    "Lobby": Lobby,
    "Notificaciones": Notificaciones,
    "PartidaEnVivo": PartidaEnVivo,
    "Partidas": Partidas,
    "Perfil": Perfil,
    "Premios": Premios,
    "SalaBingo": SalaBingo,
    "Usuarios": Usuarios,
    "MisCartones": MisCartones,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};