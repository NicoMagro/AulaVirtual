import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Upload,
  Download,
  Trash2,
  Eye,
  EyeOff,
  File,
  FileText,
  FileSpreadsheet,
  Image,
  Video,
  Archive,
  Music,
  AlertCircle,
  X,
} from 'lucide-react';
import archivosService from '../../services/archivosService';

// Función para obtener icono según tipo MIME
const obtenerIconoArchivo = (tipoMime) => {
  if (tipoMime.startsWith('image/')) return <Image size={20} className="text-blue-500" />;
  if (tipoMime.startsWith('video/')) return <Video size={20} className="text-purple-500" />;
  if (tipoMime.startsWith('audio/')) return <Music size={20} className="text-pink-500" />;
  if (tipoMime.includes('pdf')) return <FileText size={20} className="text-red-500" />;
  if (tipoMime.includes('sheet') || tipoMime.includes('excel') || tipoMime.includes('csv'))
    return <FileSpreadsheet size={20} className="text-green-500" />;
  if (tipoMime.includes('presentation') || tipoMime.includes('powerpoint'))
    return <FileText size={20} className="text-orange-500" />;
  if (tipoMime.includes('zip') || tipoMime.includes('rar') || tipoMime.includes('7z'))
    return <Archive size={20} className="text-yellow-600" />;
  return <File size={20} className="text-gray-500" />;
};

// Función para formatear tamaño de archivo
const formatearTamano = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Función para formatear fecha
const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ListaArchivos = ({ aula_id, hoja_id, esProfesor }) => {
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalSubir, setModalSubir] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  const cargarArchivos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await archivosService.obtenerArchivosAula(aula_id, hoja_id);
      setArchivos(response.data);
    } catch (err) {
      console.error('Error al cargar archivos:', err);
      setError('Error al cargar los archivos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aula_id && hoja_id) {
      cargarArchivos();
    }
  }, [aula_id, hoja_id]);

  const handleSubirArchivo = async (e) => {
    e.preventDefault();

    if (!archivoSeleccionado) {
      alert('Por favor selecciona un archivo');
      return;
    }

    try {
      setSubiendo(true);
      const formData = new FormData();
      formData.append('archivo', archivoSeleccionado);
      formData.append('aula_id', aula_id);
      formData.append('hoja_id', hoja_id);
      if (descripcion) {
        formData.append('descripcion', descripcion);
      }

      await archivosService.subirArchivo(formData);

      // Recargar archivos
      await cargarArchivos();

      // Resetear formulario
      setModalSubir(false);
      setArchivoSeleccionado(null);
      setDescripcion('');
    } catch (err) {
      console.error('Error al subir archivo:', err);
      alert(err.response?.data?.message || 'Error al subir el archivo');
    } finally {
      setSubiendo(false);
    }
  };

  const handleDescargar = async (archivo) => {
    try {
      await archivosService.descargarArchivo(archivo.id, archivo.nombre_original);
    } catch (err) {
      console.error('Error al descargar archivo:', err);
      alert('Error al descargar el archivo');
    }
  };

  const handleEliminar = async (archivo_id) => {
    if (!window.confirm('¿Estás seguro de eliminar este archivo?')) {
      return;
    }

    try {
      await archivosService.eliminarArchivo(archivo_id);
      await cargarArchivos();
    } catch (err) {
      console.error('Error al eliminar archivo:', err);
      alert('Error al eliminar el archivo');
    }
  };

  const handleToggleVisibilidad = async (archivo_id) => {
    try {
      await archivosService.cambiarVisibilidadArchivo(archivo_id);
      await cargarArchivos();
    } catch (err) {
      console.error('Error al cambiar visibilidad:', err);
      alert('Error al cambiar la visibilidad del archivo');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Archivos</h3>
        {esProfesor && (
          <button
            onClick={() => setModalSubir(true)}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Upload size={18} />
            Subir Archivo
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Lista de archivos */}
      {archivos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay archivos disponibles en esta hoja
        </div>
      ) : (
        <div className="space-y-2">
          {archivos.map((archivo) => (
            <div
              key={archivo.id}
              className={`group bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                !archivo.visible && esProfesor
                  ? 'border-yellow-300 border-2 border-dashed bg-yellow-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Información del archivo */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-1">{obtenerIconoArchivo(archivo.tipo_mime)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {archivo.nombre_original}
                    </h4>
                    {archivo.descripcion && (
                      <p className="text-sm text-gray-600 mt-1">{archivo.descripcion}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{formatearTamano(archivo.tamano_bytes)}</span>
                      <span>•</span>
                      <span>{formatearFecha(archivo.fecha_subida)}</span>
                      {archivo.subido_por_nombre && (
                        <>
                          <span>•</span>
                          <span>Subido por {archivo.subido_por_nombre}</span>
                        </>
                      )}
                    </div>
                    {esProfesor && !archivo.visible && (
                      <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Oculto para estudiantes
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  {/* Descargar */}
                  <button
                    onClick={() => handleDescargar(archivo)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Descargar"
                  >
                    <Download size={18} />
                  </button>

                  {/* Visibilidad (solo profesores) */}
                  {esProfesor && (
                    <button
                      onClick={() => handleToggleVisibilidad(archivo.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        archivo.visible
                          ? 'text-blue-600 hover:bg-blue-50'
                          : 'text-yellow-600 hover:bg-yellow-50'
                      }`}
                      title={archivo.visible ? 'Ocultar para estudiantes' : 'Mostrar a estudiantes'}
                    >
                      {archivo.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  )}

                  {/* Eliminar (solo profesores) */}
                  {esProfesor && (
                    <button
                      onClick={() => handleEliminar(archivo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para subir archivo */}
      {modalSubir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Subir Archivo</h2>
              <button
                onClick={() => {
                  setModalSubir(false);
                  setArchivoSeleccionado(null);
                  setDescripcion('');
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubirArchivo} className="p-6 space-y-4">
              {/* Selector de archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo *
                </label>
                <input
                  type="file"
                  onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                  required
                />
                {archivoSeleccionado && (
                  <p className="mt-2 text-sm text-gray-600">
                    Tamaño: {formatearTamano(archivoSeleccionado.size)}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">Máximo 100 MB</p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows="3"
                  placeholder="Describe brevemente este archivo..."
                  maxLength="500"
                />
                <p className="mt-1 text-xs text-gray-500">{descripcion.length}/500 caracteres</p>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalSubir(false);
                    setArchivoSeleccionado(null);
                    setDescripcion('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={subiendo}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={subiendo}
                >
                  {subiendo ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Subir Archivo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

ListaArchivos.propTypes = {
  aula_id: PropTypes.string.isRequired,
  hoja_id: PropTypes.string.isRequired,
  esProfesor: PropTypes.bool.isRequired,
};

export default ListaArchivos;
