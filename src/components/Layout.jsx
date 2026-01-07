import { Outlet, Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config"; // Ajusta tu ruta de importación

const Layout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/"); // Redirige al login después de salir
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* --- NAVBAR --- */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo / Nombre */}
            <div className="flex items-center">
              <Link to="/app" className="text-2xl font-bold text-green-600">
                ♻️ EcoApp
              </Link>
            </div>

            {/* Enlaces de Navegación (Escritorio) */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/app" className="text-gray-600 hover:text-green-600 font-medium transition">
                Inicio
              </Link>
              <Link to="/app/publicar" className="text-gray-600 hover:text-green-600 font-medium transition">
                Publicar
              </Link>
              <Link to="/app/mapa" className="text-gray-600 hover:text-green-600 font-medium transition">
                Mapa
              </Link>
              
              {/* Botón de Salir */}
              <button 
                onClick={handleLogout}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition text-sm font-semibold"
              >
                Salir
              </button>
            </div>

            {/* Menú Móvil (Icono simple para ejemplo) */}
            <div className="flex items-center md:hidden">
              <span className="text-xs text-gray-500 mr-2">Menú</span>
               {/* Aquí podrías agregar un botón hamburguesa real */}
            </div>
          </div>
        </div>
      </nav>

      {/* --- AQUÍ SE RENDERIZAN LOS HIJOS (Dashboard, Mapa, etc) --- */}
      <main className="p-4 sm:p-6">
        <Outlet /> 
      </main>
    </div>
  );
};

export default Layout;