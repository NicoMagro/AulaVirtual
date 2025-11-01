# Especificaciones: Landing Page con Parallax Scrolling

## 📋 Visión General

Landing page moderna y atractiva con efecto parallax scrolling para presentar el sistema AulaVirtual a usuarios no autenticados.

## 🎯 Objetivos

- Crear una primera impresión profesional y moderna
- Comunicar claramente el valor del sistema
- Facilitar el acceso a registro e inicio de sesión
- Proporcionar información sobre características principales
- Ser responsiva y accesible

## 🚪 Comportamiento de Navegación

### Usuarios No Autenticados
- **Ruta principal (`/`)**: Muestra la landing page
- Pueden navegar libremente por las secciones
- Acceso directo a Login (`/login`) y Registro (`/registro`)

### Usuarios Autenticados
- **Redireccionamiento automático**: Si intentan acceder a `/`, son redirigidos automáticamente a su dashboard correspondiente según su rol
- No ven la landing page una vez autenticados
- Acceso directo a las funcionalidades del sistema

## 🧭 Estructura del Navbar

### Distribución
```
[Logo] [Inicio] [Características] [Contacto]           [Login] [Registro]
```

### Elementos Izquierda
1. **Logo**: AulaVirtual (clickeable, vuelve a inicio)
2. **Inicio**: Scroll suave a hero section
3. **Características**: Scroll suave a sección de características
4. **Contacto**: Scroll suave a sección de contacto

### Elementos Derecha
1. **Login**: Botón secundario/outline - Navega a `/login`
2. **Registro**: Botón primario/filled - Navega a `/registro`

### Características del Navbar
- Posición: Fixed/Sticky en la parte superior
- Fondo: Transparente inicialmente, sólido al hacer scroll
- Responsive: Menú hamburguesa en móviles
- Z-index alto para estar siempre visible

## 📑 Secciones de la Landing Page

### 1. Hero Section (Inicio)
**Contenido:**
- **Título principal**: "Transforma tu aula en una experiencia digital"
- **Subtítulo**: Descripción breve del sistema (2-3 líneas)
- **CTA Principal**: Botón grande "Crear una cuenta"
- **CTA Secundario**: Texto con link "¿Ya tienes una cuenta? Inicia Sesión"

**Efectos Visuales:**
- Parallax con figuras geométricas en el fondo
- Intensidad: Media (entre sutil y pronunciado)
- Figuras: Círculos, triángulos, cuadrados con opacidad baja
- Colores: Derivados del azul primary

**Altura:** Viewport completo (100vh)

### 2. Cómo Funciona
**Contenido:**
- Título de sección: "¿Cómo funciona?"
- 3 pasos ilustrados:
  1. **Para Profesores**: Crea evaluaciones, gestiona aulas
  2. **Para Estudiantes**: Realiza evaluaciones, consulta resultados
  3. **Resultados**: Calificación automática, estadísticas

**Elementos Visuales:**
- Iconos SVG para cada paso
- Layout horizontal en desktop, vertical en móvil
- Animaciones fade-in al entrar en viewport

### 3. Beneficios
**Contenido:**
- Título de sección: "Beneficios"
- Grid de 4-6 tarjetas de beneficios:
  - Evaluaciones inteligentes con calificación automática
  - Múltiples tipos de preguntas
  - Puntaje proporcional justo
  - Estadísticas detalladas
  - Sistema de consultas integrado
  - Gestión de contenido flexible

**Elementos Visuales:**
- Cards con hover effects (elevación, brillo)
- Iconos SVG educativos y amigables
- Parallax en el fondo (segunda capa)
- Grid responsive (3 cols desktop, 2 cols tablet, 1 col móvil)

### 4. Características Principales
**Contenido:**
- Título de sección: "Características"
- Features destacadas:
  - **Sistema de Evaluaciones**: 4 tipos de preguntas, calificación automática/manual
  - **Gestión de Aulas**: Organización con hojas, contenido multimedia
  - **Banco de Preguntas**: Creación, edición, reutilización
  - **Consultas y Respuestas**: Sistema de Q&A con imágenes
  - **Múltiples Intentos**: Configuración flexible
  - **Estadísticas y Reportes**: Exportación a Excel/PDF
  - **Soporte de Imágenes**: En preguntas y opciones
  - **Puntaje Proporcional**: Sistema justo de calificación

**Elementos Visuales:**
- Grid de cards con iconos
- Descripción breve de cada característica
- Hover effects
- Parallax en el fondo (tercera capa)

### 5. Estadísticas (Placeholder)
**Contenido:**
- Título de sección: "Nuestro Impacto"
- 4 métricas principales (valores placeholder):
  - Usuarios activos
  - Evaluaciones creadas
  - Aulas virtuales
  - Estudiantes satisfechos

**Nota:** Sección básica para completar cuando el sitio esté en producción

**Elementos Visuales:**
- Números grandes con animación al aparecer
- Iconos representativos
- Fondo con gradiente

### 6. Contacto (Placeholder)
**Contenido:**
- Título de sección: "Contáctanos"
- Estructura básica para:
  - Email
  - Redes sociales
  - Formulario de contacto (opcional)

**Nota:** Se completará con información real posteriormente

### 7. Footer
**Contenido:**
- Logo y nombre del proyecto
- Links rápidos (Inicio, Características, Contacto, Login, Registro)
- Información de copyright
- Enlaces a redes sociales (placeholder)

## 🎨 Estilo Visual

### Paleta de Colores
- **Base**: Mantener los colores actuales del sistema
- **Primary**: Azul (#0066cc o similar)
- **Secondary**: Derivados del primary
- **Neutrales**: Grises para texto y fondos

### Modo Oscuro/Claro
- **Toggle**: En el navbar, lado derecho (antes de Login)
- **Persistencia**: localStorage
- **Transición**: Suave entre modos
- **Ajustes automáticos**:
  - Colores de fondo
  - Texto
  - Figuras geométricas (opacidad y color)
  - Cards y sombras

### Tipografía
- **Headings**: Bold, tamaños grandes para impacto
- **Body**: Regular, legible
- **CTAs**: Semi-bold, destacados

### Estilo General
- **Tono**: Educativo y amigable
- **Espaciado**: Generoso, respirable
- **Bordes**: Redondeados (rounded-lg, rounded-xl)
- **Sombras**: Sutiles, elegantes

## ✨ Efectos y Animaciones

### Parallax Scrolling
- **Secciones con parallax**: 3 (Hero, Beneficios, Características)
- **Intensidad**: Media (factor 0.3-0.5)
- **Elementos parallax**:
  - Figuras geométricas en capas
  - Velocidades diferentes por capa
  - Opacidad reducida para no distraer

### Figuras Geométricas
- **Formas**: Círculos, triángulos, cuadrados
- **Tamaños**: Variados (pequeños, medianos, grandes)
- **Colores**: Tonos del primary con opacidad 10-20%
- **Distribución**: Esparcidas orgánicamente
- **Movimiento**: Parallax a diferentes velocidades

### Animaciones al Scroll
- **Fade in**: Elementos aparecen suavemente
- **Slide up**: Cards suben desde abajo
- **Stagger**: Elementos aparecen en secuencia
- **Trigger**: Intersection Observer (cuando entran en viewport)
- **Duración**: 0.5-0.8 segundos

### Efectos Hover
- **Botones**:
  - Elevación (transform: translateY)
  - Cambio de color sutil
  - Transición suave
- **Cards**:
  - Elevación con sombra
  - Escala ligera (scale: 1.02-1.05)
  - Brillo en borde superior
- **Links**:
  - Underline animado
  - Cambio de color

## 🎯 Calls to Action (CTAs)

### CTA Principal
- **Texto**: "Crear una cuenta"
- **Estilo**: Botón grande, color primary, texto blanco
- **Ubicación**: Hero section (prominente)
- **Acción**: Navega a `/registro`

### CTA Secundario
- **Texto**: "¿Ya tienes una cuenta? Inicia Sesión"
- **Estilo**: Texto con enlace subrayado
- **Ubicación**: Debajo del CTA principal
- **Acción**: Navega a `/login`

### CTAs Adicionales
- Botones "Crear cuenta" y "Login" en el navbar
- CTAs sutiles al final de secciones importantes

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Adaptaciones Móvil
- Navbar: Menú hamburguesa
- Hero: Texto más pequeño, stack vertical
- Secciones: 1 columna
- Parallax: Reducir o desactivar en móvil (rendimiento)
- CTAs: Botones full-width

### Adaptaciones Tablet
- Navbar: Compacto pero visible
- Secciones: 2 columnas cuando sea posible
- Parallax: Intensidad reducida

## 🔧 Implementación Técnica

### Tecnologías
- **React 19**: Framework base
- **Framer Motion**: Animaciones y parallax
- **React Intersection Observer**: Detección de viewport
- **Tailwind CSS**: Estilos
- **React Router**: Navegación

### Componentes Clave
1. **LandingPage.jsx**: Componente principal
2. **LandingNavbar.jsx**: Navbar específico
3. **ParallaxSection.jsx**: Wrapper reutilizable
4. **ThemeToggle.jsx**: Toggle modo oscuro/claro
5. **ThemeContext.jsx**: Context para tema global

### Rutas
- `/`: Landing page (usuarios no autenticados)
- `/login`: Página de login
- `/registro`: Página de registro
- Usuarios autenticados: Redirigir desde `/` al dashboard

## 📊 Métricas de Éxito

### Performance
- Tiempo de carga < 3 segundos
- Smooth scrolling 60fps
- First Contentful Paint < 1.5s

### UX
- Navegación intuitiva
- CTAs visibles y claros
- Animaciones no invasivas
- Responsive en todos los dispositivos

### Conversión
- Tasa de clics en "Crear cuenta"
- Tiempo promedio en la página
- Scroll depth (cuánto bajan los usuarios)

## 🚀 Fases de Desarrollo

### Fase 1: MVP (Actual)
- ✅ Estructura básica documentada
- Estructura HTML/componentes
- Estilos base con Tailwind
- Parallax básico en 3 secciones
- Navegación funcional

### Fase 2: Refinamiento
- Animaciones al scroll
- Modo oscuro/claro
- Optimización de performance
- Ajustes de diseño según feedback

### Fase 3: Contenido Final
- Completar sección de estadísticas
- Agregar información de contacto real
- Imágenes/ilustraciones finales
- Testing exhaustivo

## 📝 Notas Adicionales

- El video explicativo se agregará en una fase posterior
- Las estadísticas mostrarán datos reales cuando el sitio esté en producción
- La información de contacto se completará con datos reales proporcionados posteriormente
- Todas las animaciones y efectos pueden ajustarse según preferencias y feedback
- Las figuras geométricas pueden cambiarse por ilustraciones si no convencen visualmente

---

**Última actualización**: 2025-10-31
**Estado**: En desarrollo
