import { ExternalLink, Minus } from 'lucide-react';
import PropTypes from 'prop-types';

const BloqueContenido = ({ bloque }) => {
  const { tipo, contenido } = bloque;

  switch (tipo) {
    case 'titulo':
      return (
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {contenido}
        </h1>
      );

    case 'subtitulo':
      return (
        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
          {contenido}
        </h2>
      );

    case 'parrafo':
      return (
        <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
          {contenido}
        </p>
      );

    case 'lista':
      // Asumimos que el contenido viene separado por saltos de línea
      const items = contenido.split('\n').filter(item => item.trim());
      return (
        <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700">
          {items.map((item, index) => (
            <li key={index} className="ml-4">
              {item.trim()}
            </li>
          ))}
        </ul>
      );

    case 'enlace':
      // Asumimos formato: "Texto del enlace|URL" o solo la URL
      const partes = contenido.split('|');
      const texto = partes.length > 1 ? partes[0].trim() : contenido;
      const url = partes.length > 1 ? partes[1].trim() : contenido;

      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 underline mb-4"
        >
          <ExternalLink size={16} />
          {texto}
        </a>
      );

    case 'separador':
      return (
        <div className="flex items-center justify-center my-6">
          <Minus size={24} className="text-gray-300" />
          <div className="flex-grow h-px bg-gray-300 mx-2"></div>
          <Minus size={24} className="text-gray-300" />
        </div>
      );

    default:
      return (
        <div className="text-gray-500 italic mb-4">
          Tipo de bloque no soportado: {tipo}
        </div>
      );
  }
};

BloqueContenido.propTypes = {
  bloque: PropTypes.shape({
    tipo: PropTypes.string.isRequired,
    contenido: PropTypes.string.isRequired,
  }).isRequired,
};

export default BloqueContenido;
