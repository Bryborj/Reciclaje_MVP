import React from 'react';
// Si usas React Router, descomenta la siguiente línea:
// import { Link } from 'react-router-dom';

const Error404 = () => {
  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        {/* Código de error */}
        <p className="text-base font-semibold text-indigo-600">404</p>
        
        {/* Título principal */}
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Página no encontrada
        </h1>
        
        {/* Descripción amigable */}
        <p className="mt-6 text-base leading-7 text-gray-600">
          Lo sentimos, no pudimos encontrar la página que estás buscando.
        </p>
        
        {/* Botones de acción */}
        <div className="mt-10 flex items-center justify-center gap-x-6">
          {/* Botón Primario: Ir al Inicio */}
          {/* Si usas React Router, cambia <a> por <Link to="/"> */}
          <a
            href="/"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors duration-200"
          >
            Volver al inicio
          </a>

          {/* Botón Secundario: Contacto */}
          <a href="/contacto" className="text-sm font-semibold text-gray-900 flex items-center gap-1 group">
            Contactar soporte 
            <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">
              &rarr;
            </span>
          </a>
        </div>
      </div>
    </main>
  );
};

export default Error404;