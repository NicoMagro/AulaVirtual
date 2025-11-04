import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import notificacionesService from '../services/notificacionesService';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  // Inicializar socket cuando el usuario está autenticado
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Si no está autenticado, desconectar socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Crear conexión socket
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Eventos de conexión
    newSocket.on('connect', () => {
      console.log('✓ WebSocket conectado:', newSocket.id);
      setConnected(true);

      // Autenticar con el servidor
      const token = localStorage.getItem('token');
      if (token) {
        newSocket.emit('authenticate', token);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('✗ WebSocket desconectado');
      setConnected(false);
    });

    newSocket.on('authenticated', (data) => {
      console.log('✓ WebSocket autenticado:', data);
    });

    newSocket.on('authentication_error', (error) => {
      console.error('✗ Error de autenticación WebSocket:', error);
    });

    // Escuchar notificaciones
    newSocket.on('nueva_notificacion', (notificacion) => {
      console.log('Nueva notificación recibida:', notificacion);
      setNotificaciones((prev) => [notificacion, ...prev]);
      setNotificacionesNoLeidas((prev) => prev + 1);

      // Mostrar notificación del navegador si está permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notificacion.titulo, {
          body: notificacion.mensaje,
          icon: '/logo.png',
        });
      }
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Cargar notificaciones al montar
  useEffect(() => {
    if (isAuthenticated && user) {
      cargarNotificaciones();
    }
  }, [isAuthenticated, user]);

  // Solicitar permiso para notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Cargar notificaciones desde el servidor
  const cargarNotificaciones = useCallback(async () => {
    try {
      const response = await notificacionesService.obtenerNotificaciones();
      if (response.success) {
        setNotificaciones(response.data);
        setNotificacionesNoLeidas(response.no_leidas || 0);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  }, []);

  // Marcar notificación como leída
  const marcarComoLeida = useCallback(async (notificacionId) => {
    try {
      await notificacionesService.marcarComoLeida(notificacionId);

      setNotificaciones((prev) =>
        prev.map((notif) =>
          notif.id === notificacionId ? { ...notif, leida: true } : notif
        )
      );

      setNotificacionesNoLeidas((prev) => Math.max(0, prev - 1));

      // Emitir evento al servidor via socket
      if (socket && connected) {
        socket.emit('marcar_leida', notificacionId);
      }
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  }, [socket, connected]);

  // Marcar todas como leídas
  const marcarTodasComoLeidas = useCallback(async () => {
    try {
      await notificacionesService.marcarTodasComoLeidas();

      setNotificaciones((prev) =>
        prev.map((notif) => ({ ...notif, leida: true }))
      );

      setNotificacionesNoLeidas(0);
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
    }
  }, []);

  // Eliminar notificación
  const eliminarNotificacion = useCallback(async (notificacionId) => {
    try {
      await notificacionesService.eliminarNotificacion(notificacionId);

      const notif = notificaciones.find((n) => n.id === notificacionId);
      if (notif && !notif.leida) {
        setNotificacionesNoLeidas((prev) => Math.max(0, prev - 1));
      }

      setNotificaciones((prev) => prev.filter((n) => n.id !== notificacionId));
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  }, [notificaciones]);

  const value = {
    socket,
    connected,
    notificaciones,
    notificacionesNoLeidas,
    cargarNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe ser usado dentro de un SocketProvider');
  }
  return context;
};
