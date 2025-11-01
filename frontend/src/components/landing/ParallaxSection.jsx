import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import PropTypes from 'prop-types';

const ParallaxSection = ({
  children,
  id,
  className = '',
  intensity = 0.4,
  showGeometricShapes = true
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  // Transformaciones parallax para diferentes capas
  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', `${intensity * 100}%`]);
  const y2 = useTransform(scrollYProgress, [0, 1], ['0%', `${intensity * 150}%`]);
  const y3 = useTransform(scrollYProgress, [0, 1], ['0%', `${intensity * 200}%`]);

  return (
    <section ref={ref} id={id} className={`relative overflow-hidden ${className}`}>
      {/* Figuras geométricas con parallax */}
      {showGeometricShapes && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Capa 1 - Círculos */}
          <motion.div style={{ y: y1 }} className="absolute inset-0">
            <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary-500/10 dark:bg-primary-400/10" />
            <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-primary-600/10 dark:bg-primary-300/10" />
            <div className="absolute bottom-32 left-1/4 w-40 h-40 rounded-full bg-primary-400/10 dark:bg-primary-500/10" />
          </motion.div>

          {/* Capa 2 - Triángulos */}
          <motion.div style={{ y: y2 }} className="absolute inset-0">
            <svg
              className="absolute top-1/4 right-1/4 w-28 h-28 text-primary-500/10 dark:text-primary-400/10"
              viewBox="0 0 100 100"
            >
              <polygon points="50,10 90,90 10,90" fill="currentColor" />
            </svg>
            <svg
              className="absolute bottom-1/3 left-1/3 w-36 h-36 text-primary-600/10 dark:text-primary-300/10"
              viewBox="0 0 100 100"
            >
              <polygon points="50,10 90,90 10,90" fill="currentColor" />
            </svg>
          </motion.div>

          {/* Capa 3 - Cuadrados */}
          <motion.div style={{ y: y3 }} className="absolute inset-0">
            <div className="absolute top-1/3 left-20 w-20 h-20 bg-primary-500/10 dark:bg-primary-400/10 rounded-lg transform rotate-12" />
            <div className="absolute bottom-1/4 right-1/3 w-28 h-28 bg-primary-600/10 dark:bg-primary-300/10 rounded-lg transform -rotate-6" />
            <div className="absolute top-2/3 right-10 w-24 h-24 bg-primary-400/10 dark:bg-primary-500/10 rounded-lg transform rotate-45" />
          </motion.div>
        </div>
      )}

      {/* Contenido de la sección */}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
};

ParallaxSection.propTypes = {
  children: PropTypes.node.isRequired,
  id: PropTypes.string,
  className: PropTypes.string,
  intensity: PropTypes.number,
  showGeometricShapes: PropTypes.bool
};

export default ParallaxSection;
