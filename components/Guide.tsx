import React from 'react';
import { Icons } from './Icons';

interface GuideProps {
    t: any;
}

export const Guide: React.FC<GuideProps> = ({ t }) => {
  return (
    <div className="pb-32 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-6 shadow-sm sticky top-0 z-20 border-b border-stone-100 dark:border-stone-800">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
           <span className="bg-blue-500 text-white p-1.5 rounded-lg">
             <Icons.Help size={20} />
           </span>
           {t.navGuide}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">{t.navGuideInfo}</p>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2 text-rose-500">
                <Icons.Chef size={20} /> 1. Gestión de Recetas
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 mb-2">
                En la pestaña <strong>Inicio</strong>, puedes agregar recetas de dos formas:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 dark:text-stone-300 space-y-1 ml-2">
                <li><strong>Manual:</strong> Escribe el nombre y agrega ingredientes uno a uno.</li>
                <li><strong>Archivo TXT:</strong> Sube un archivo de texto con la lista de ingredientes (ej. "- Harina: 500g").</li>
            </ul>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2 text-amber-500">
                <Icons.Money size={20} /> 2. Precios y Costos
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 mb-2">
                Al seleccionar una receta por primera vez, se abrirá la configuración de precios.
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 dark:text-stone-300 space-y-1 ml-2">
                <li>Ingresa el <strong>Precio de Compra</strong> del paquete completo.</li>
                <li>La app calcula automáticamente cuánto cuesta la cantidad usada en la receta.</li>
                <li>Puedes agregar <strong>Otros Gastos</strong> fijos (gas, luz, cajas).</li>
                <li>Usa la sección <strong>Costos Globales</strong> en el menú inferior para ver y editar todos los insumos juntos.</li>
            </ul>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2 text-green-500">
                <Icons.Calc size={20} /> 3. Análisis Financiero
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 mb-2">
                Dentro de cada receta, verás:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 dark:text-stone-300 space-y-1 ml-2">
                <li><strong>Costo por Unidad:</strong> Cuánto te cuesta producir una pieza.</li>
                <li><strong>Precio Sugerido:</strong> Basado en el margen de ganancia que elijas (ej. 45%).</li>
                <li><strong>Modo Lote (Batch):</strong> Calcula costos para producción masiva (ej. 12 cupcakes).</li>
            </ul>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2 text-purple-500">
                <Icons.PieChart size={20} /> 4. Finanzas Globales
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300">
                La pestaña <strong>Finanzas</strong> te muestra un resumen total de tu negocio si vendieras una unidad de cada receta guardada. Ayuda a entender la rentabilidad general.
            </p>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2 text-stone-500">
                <Icons.Save size={20} /> 5. Respaldo de Datos
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 mb-2">
                Tus datos se guardan automáticamente en tu dispositivo.
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 dark:text-stone-300 space-y-1 ml-2">
                <li>Usa el botón <Icons.Download size={14} className="inline"/> para descargar una copia de seguridad.</li>
                <li>Usa el botón <Icons.UploadDB size={14} className="inline"/> para restaurar tus datos en otro dispositivo.</li>
            </ul>
        </div>

      </div>
    </div>
  );
};