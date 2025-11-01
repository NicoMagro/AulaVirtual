import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import LandingNavbar from '../components/landing/LandingNavbar';
import ParallaxSection from '../components/landing/ParallaxSection';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <LandingNavbar />

      {/* Hero Section */}
      <ParallaxSection id="inicio" className="min-h-screen flex items-center justify-center pt-16" intensity={0.4}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
              Transforma tu aula en una{' '}
              <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                experiencia digital
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
              Sistema integral de gestión educativa con evaluaciones inteligentes,
              calificación automática y estadísticas detalladas para profesores y estudiantes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/registro"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Crear una cuenta
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto text-lg text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                ¿Ya tienes una cuenta? <span className="underline">Inicia Sesión</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </ParallaxSection>

      {/* Cómo Funciona */}
      <ComoFuncionaSection />

      {/* Beneficios */}
      <ParallaxSection id="beneficios" className="py-20 bg-gray-50 dark:bg-gray-800" intensity={0.3}>
        <BeneficiosSection />
      </ParallaxSection>

      {/* Características Principales */}
      <ParallaxSection id="caracteristicas" className="py-20" intensity={0.35}>
        <CaracteristicasSection />
      </ParallaxSection>

      {/* Estadísticas */}
      <EstadisticasSection />

      {/* Contacto */}
      <ContactoSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

// Sección: Cómo Funciona
const ComoFuncionaSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const steps = [
    {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: 'Para Profesores',
      description: 'Crea evaluaciones con múltiples tipos de preguntas, gestiona aulas y organiza tu contenido de forma flexible.'
    },
    {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Para Estudiantes',
      description: 'Realiza evaluaciones de forma intuitiva, consulta tus resultados en tiempo real y revisa estadísticas de rendimiento.'
    },
    {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Resultados',
      description: 'Calificación automática inteligente con puntaje proporcional justo y estadísticas detalladas exportables.'
    }
  ];

  return (
    <section ref={ref} className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Un sistema diseñado para hacer la educación más eficiente y accesible
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center hover:shadow-xl transition-shadow"
            >
              <div className="inline-block p-4 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full mb-6">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Sección: Beneficios
const BeneficiosSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const benefits = [
    {
      icon: '⚡',
      title: 'Evaluaciones Inteligentes',
      description: 'Calificación automática con algoritmos justos y precisos'
    },
    {
      icon: '📝',
      title: 'Múltiples Tipos de Preguntas',
      description: 'Verdadero/Falso, opción múltiple, desarrollo y más'
    },
    {
      icon: '⚖️',
      title: 'Puntaje Proporcional',
      description: 'Sistema de calificación justo y equilibrado'
    },
    {
      icon: '📊',
      title: 'Estadísticas Detalladas',
      description: 'Análisis completo del rendimiento académico'
    },
    {
      icon: '💬',
      title: 'Sistema de Consultas',
      description: 'Comunicación integrada entre profesores y estudiantes'
    },
    {
      icon: '🎯',
      title: 'Gestión Flexible',
      description: 'Organiza tu contenido de la manera que prefieras'
    }
  ];

  return (
    <div ref={ref} className="container mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Beneficios
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Descubre todo lo que AulaVirtual puede hacer por ti
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-xl p-6 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer border border-gray-200 dark:border-gray-700"
          >
            <div className="text-4xl mb-4">{benefit.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {benefit.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {benefit.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Sección: Características Principales
const CaracteristicasSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    {
      icon: '📋',
      title: 'Sistema de Evaluaciones',
      description: '4 tipos de preguntas con calificación automática y manual'
    },
    {
      icon: '🏫',
      title: 'Gestión de Aulas',
      description: 'Organización con hojas y contenido multimedia'
    },
    {
      icon: '💾',
      title: 'Banco de Preguntas',
      description: 'Creación, edición y reutilización de preguntas'
    },
    {
      icon: '❓',
      title: 'Consultas y Respuestas',
      description: 'Sistema de Q&A con soporte de imágenes'
    },
    {
      icon: '🔄',
      title: 'Múltiples Intentos',
      description: 'Configuración flexible de intentos por evaluación'
    },
    {
      icon: '📈',
      title: 'Estadísticas y Reportes',
      description: 'Exportación a Excel y PDF con análisis detallado'
    },
    {
      icon: '🖼️',
      title: 'Soporte de Imágenes',
      description: 'Incluye imágenes en preguntas y opciones'
    },
    {
      icon: '🎯',
      title: 'Puntaje Proporcional',
      description: 'Sistema justo de calificación para opciones múltiples'
    }
  ];

  return (
    <div ref={ref} className="container mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Características
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Todas las herramientas que necesitas en un solo lugar
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all border border-gray-200 dark:border-gray-700"
          >
            <div className="text-3xl mb-4">{feature.icon}</div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Sección: Estadísticas (Placeholder)
const EstadisticasSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const stats = [
    { value: '1,000+', label: 'Usuarios Activos' },
    { value: '5,000+', label: 'Evaluaciones Creadas' },
    { value: '100+', label: 'Aulas Virtuales' },
    { value: '98%', label: 'Satisfacción' }
  ];

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Nuestro Impacto
          </h2>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto">
            Números que hablan por sí mismos
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-primary-100">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Sección: Contacto (Placeholder)
const ContactoSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} id="contacto" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Contáctanos
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            ¿Tienes preguntas o comentarios? Nos encantaría escucharte.
          </p>
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>📧 Email: contacto@aulavirtual.com</p>
            <p>📱 Redes Sociales: (Próximamente)</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-300 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Logo y descripción */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-white">AulaVirtual</span>
            </div>
            <p className="text-sm text-gray-400">
              Transforma tu aula en una experiencia digital moderna y eficiente.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="font-semibold text-white mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => scrollToSection('inicio')} className="hover:text-primary-400 transition-colors">
                  Inicio
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('caracteristicas')} className="hover:text-primary-400 transition-colors">
                  Características
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('contacto')} className="hover:text-primary-400 transition-colors">
                  Contacto
                </button>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary-400 transition-colors">
                  Iniciar Sesión
                </Link>
              </li>
              <li>
                <Link to="/registro" className="hover:text-primary-400 transition-colors">
                  Registro
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes sociales (placeholder) */}
          <div>
            <h3 className="font-semibold text-white mb-4">Síguenos</h3>
            <p className="text-sm text-gray-400">Próximamente en redes sociales</p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} AulaVirtual. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default LandingPage;
