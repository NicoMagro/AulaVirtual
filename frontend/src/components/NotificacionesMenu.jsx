import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';

const NotificacionesMenu = () => {
  const navigate = useNavigate();
  const {
    notificaciones,
    notificacionesNoLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
  } = useSocket();
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMostrarMenu(false);
      }
    };

    if (mostrarMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarMenu]);

  const handleNotificacionClick = async (notificacion) => {
    // Marcar como leída si no lo está
    if (!notificacion.leida) {
      await marcarComoLeida(notificacion.id);
    }

    // Navegar al aula o consulta si aplica
    if (notificacion.consulta_id) {
      navigate(`/aula/${notificacion.aula_id}`);
    } else if (notificacion.aula_id) {
      navigate(`/aula/${notificacion.aula_id}`);
    }

    setMostrarMenu(false);
  };

  const handleEliminar = async (e, notificacionId) => {
    e.stopPropagation();
    await eliminarNotificacion(notificacionId);
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'nueva_consulta':
        return 'bg-blue-100 text-blue-800';
      case 'nueva_respuesta':
        return 'bg-green-100 text-green-800';
      case 'consulta_resuelta':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón de notificaciones */}
      <button
        onClick={() => setMostrarMenu(!mostrarMenu)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        title="Notificaciones"
      >
        <Bell size={20} />
        {notificacionesNoLeidas > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
          </span>
        )}
      </button>

      {/* Menú desplegable */}
      {mostrarMenu && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            {notificacionesNoLeidas > 0 && (
              <button
                onClick={marcarTodasComoLeidas}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
                title="Marcar todas como leídas"
              >
                <CheckCheck size={14} />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notificaciones.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificacionClick(notif)}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notif.leida ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTipoColor(
                              notif.tipo
                            )}`}
                          >
                            {notif.tipo === 'nueva_consulta' && 'Consulta'}
                            {notif.tipo === 'nueva_respuesta' && 'Respuesta'}
                            {notif.tipo === 'consulta_resuelta' && 'Resuelta'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatearFecha(notif.fecha_creacion)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {notif.titulo}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notif.mensaje}
                        </p>
                        {notif.aula_nombre && (
                          <p className="text-xs text-gray-500 mt-1">
                            📚 {notif.aula_nombre}
                          </p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-2">
                        {!notif.leida && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              marcarComoLeida(notif.id);
                            }}
                            className="text-gray-400 hover:text-green-600 transition-colors"
                            title="Marcar como leída"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleEliminar(e, notif.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificaciones.length > 0 && (
            <div className="p-3 border-t bg-gray-50 text-center">
              <button
                onClick={() => setMostrarMenu(false)}
                className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificacionesMenu;
