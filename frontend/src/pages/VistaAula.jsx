import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import contenidoService from '../services/contenidoService';
import aulasService from '../services/aulasService';
import hojasService from '../services/hojasService';
import {
  ArrowLeft,
  Edit,
  Save,
  Plus,
  Trash2,
  GripVertical,
  AlertCircle,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Componentes para cada tipo de bloque
import BloqueContenido from '../components/contenido/BloqueContenido';
import ModalEditarBloque from '../components/contenido/ModalEditarBloque';
import TabsHojas from '../components/contenido/TabsHojas';
import ModalGestionarHojas from '../components/contenido/ModalGestionarHojas';

// Componente para un bloque arrastrable
const BloqueSortable = ({ bloque, modoEdicion, esProfesor, handleEditarBloque, handleEliminarBloque }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bloque.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${
        modoEdicion ? 'hover:bg-gray-50 rounded-lg p-2 transition-colors' : ''
      }`}
    >
      {/* Controles de edición */}
      {modoEdicion && esProfesor && (
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            {...attributes}
            {...listeners}
            className="p-1 bg-white hover:bg-gray-100 rounded shadow-md cursor-grab active:cursor-grabbing"
            title="Arrastrar"
          >
            <GripVertical size={16} className="text-gray-400" />
          </button>
        </div>
      )}

      {/* Contenido del bloque */}
      <BloqueContenido bloque={bloque} />

      {/* Botones de edición y eliminación */}
      {modoEdicion && esProfesor && (
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleEditarBloque(bloque)}
            className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded shadow-md"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleEliminarBloque(bloque.id)}
            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded shadow-md"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

BloqueSortable.propTypes = {
  bloque: PropTypes.object.isRequired,
  modoEdicion: PropTypes.bool.isRequired,
  esProfesor: PropTypes.bool.isRequired,
  handleEditarBloque: PropTypes.func.isRequired,
  handleEliminarBloque: PropTypes.func.isRequired,
};

const VistaAula = () => {
  const { aula_id } = useParams();
  const navigate = useNavigate();
  const { rolActivo } = useAuth();

  const [aula, setAula] = useState(null);
  const [hojas, setHojas] = useState([]);
  const [hojaActiva, setHojaActiva] = useState(null);
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState(null);
  const [nuevoBloque, setNuevoBloque] = useState(false);
  const [modalGestionarHojas, setModalGestionarHojas] = useState(false);

  const esProfesor = rolActivo === 'profesor' || rolActivo === 'admin';

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const cargarHojas = async () => {
    try {
      const responseHojas = await hojasService.obtenerHojasAula(aula_id);
      setHojas(responseHojas.data);

      // Si no hay hoja activa, seleccionar la primera
      if (!hojaActiva && responseHojas.data.length > 0) {
        setHojaActiva(responseHojas.data[0]);
      }
    } catch (err) {
      console.error('Error al cargar hojas:', err);
    }
  };

  const cargarContenido = async (hoja_id) => {
    try {
      const responseContenido = await contenidoService.obtenerContenidoAula(aula_id, hoja_id);
      setBloques(responseContenido.data);
    } catch (err) {
      console.error('Error al cargar contenido:', err);
      setBloques([]);
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar información del aula
      const responseAula = await aulasService.obtenerAula(aula_id);
      setAula(responseAula.data);

      // Cargar hojas del aula
      await cargarHojas();
    } catch (err) {
      setError('Error al cargar el contenido del aula');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [aula_id]);

  // Cargar contenido cuando cambia la hoja activa
  useEffect(() => {
    if (hojaActiva) {
      cargarContenido(hojaActiva.id);
    }
  }, [hojaActiva]);

  const handleAgregarBloque = () => {
    setBloqueSeleccionado(null);
    setNuevoBloque(true);
    setModalEditar(true);
  };

  const handleEditarBloque = (bloque) => {
    setBloqueSeleccionado(bloque);
    setNuevoBloque(false);
    setModalEditar(true);
  };

  const handleEliminarBloque = async (bloque_id) => {
    if (!window.confirm('¿Estás seguro de eliminar este bloque?')) {
      return;
    }

    try {
      await contenidoService.eliminarBloque(bloque_id);
      if (hojaActiva) {
        await cargarContenido(hojaActiva.id);
      }
    } catch (err) {
      alert('Error al eliminar el bloque');
      console.error(err);
    }
  };

  const handleGuardarBloque = async () => {
    if (hojaActiva) {
      await cargarContenido(hojaActiva.id);
    }
    setModalEditar(false);
    setBloqueSeleccionado(null);
  };

  const handleCambiarHoja = (hoja) => {
    setHojaActiva(hoja);
    setModoEdicion(false); // Salir del modo edición al cambiar de hoja
  };

  const handleGestionarHojas = () => {
    setModalGestionarHojas(true);
  };

  const handleSuccessGestionarHojas = async () => {
    // Recargar hojas después de gestionar
    await cargarHojas();
    setModalGestionarHojas(false);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = bloques.findIndex((b) => b.id === active.id);
      const newIndex = bloques.findIndex((b) => b.id === over.id);

      const newBloques = arrayMove(bloques, oldIndex, newIndex);

      // Actualizar el orden localmente
      setBloques(newBloques);

      // Preparar datos para el backend: asignar nuevos valores de orden
      const bloquesActualizados = newBloques.map((bloque, index) => ({
        id: bloque.id,
        orden: index,
      }));

      // Guardar el nuevo orden en el backend
      try {
        await contenidoService.reordenarBloques(aula_id, bloquesActualizados);
      } catch (err) {
        console.error('Error al reordenar bloques:', err);
        // Recargar si hay error para mantener sincronización
        if (hojaActiva) {
          await cargarContenido(hojaActiva.id);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{aula?.nombre}</h1>
            <p className="text-gray-600 mt-1">{aula?.descripcion}</p>
          </div>
        </div>

        {esProfesor && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModoEdicion(!modoEdicion)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                modoEdicion
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {modoEdicion ? <Save size={20} /> : <Edit size={20} />}
              {modoEdicion ? 'Finalizar Edición' : 'Editar Contenido'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Pestañas de hojas */}
      {hojas.length > 0 && (
        <TabsHojas
          hojas={hojas}
          hojaActiva={hojaActiva}
          onCambiarHoja={handleCambiarHoja}
          onGestionarHojas={handleGestionarHojas}
          esProfesor={esProfesor}
        />
      )}

      {/* Contenido del aula */}
      <div className="bg-white rounded-lg shadow-md p-8">
        {bloques.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {esProfesor
                ? 'No hay contenido en esta aula. Comienza agregando bloques.'
                : 'Esta aula aún no tiene contenido disponible.'}
            </p>
            {esProfesor && modoEdicion && (
              <button
                onClick={handleAgregarBloque}
                className="mt-4 flex items-center gap-2 mx-auto bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={20} />
                Agregar Primer Bloque
              </button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={bloques.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
              disabled={!modoEdicion || !esProfesor}
            >
              <div className="space-y-4">
                {bloques.map((bloque) => (
                  <BloqueSortable
                    key={bloque.id}
                    bloque={bloque}
                    modoEdicion={modoEdicion}
                    esProfesor={esProfesor}
                    handleEditarBloque={handleEditarBloque}
                    handleEliminarBloque={handleEliminarBloque}
                  />
                ))}

                {/* Botón para agregar nuevo bloque */}
                {modoEdicion && esProfesor && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleAgregarBloque}
                      className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus size={20} />
                      Agregar Bloque
                    </button>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Modal para editar/crear bloques */}
      {modalEditar && hojaActiva && (
        <ModalEditarBloque
          isOpen={modalEditar}
          onClose={() => {
            setModalEditar(false);
            setBloqueSeleccionado(null);
            setNuevoBloque(false);
          }}
          bloque={bloqueSeleccionado}
          aula_id={aula_id}
          hoja_id={hojaActiva.id}
          onSuccess={handleGuardarBloque}
          esNuevo={nuevoBloque}
          ordenSiguiente={bloques.length}
        />
      )}

      {/* Modal para gestionar hojas */}
      {modalGestionarHojas && (
        <ModalGestionarHojas
          isOpen={modalGestionarHojas}
          onClose={() => setModalGestionarHojas(false)}
          hojas={hojas}
          aula_id={aula_id}
          onSuccess={handleSuccessGestionarHojas}
        />
      )}
    </div>
  );
};

export default VistaAula;
