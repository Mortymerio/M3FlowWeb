import { Sparkles } from 'lucide-react';

interface QuickAction {
  icon: string;
  name: string;
  prompt: string;
}

interface ActionCategory {
  label: string;
  color: string;
  actions: QuickAction[];
}

const QUICK_ACTIONS: ActionCategory[] = [{
  label: '✍️ Transformar',
  color: 'blue',
  actions: [
    { icon: '📋', name: 'Acta de Reunión', prompt: 'Transforma esta nota en un acta de reunión profesional con secciones: Asistentes, Puntos Discutidos, Decisiones Tomadas y Próximos Pasos.' },
    { icon: '✅', name: 'Checklist', prompt: 'Extrae todas las tareas, compromisos e intenciones del texto y conviértelos en una checklist Markdown con casillas [ ].' },
    { icon: '📝', name: 'Resumen Ejecutivo', prompt: 'Genera un resumen ejecutivo de esta nota en 5 puntos clave usando bullet points en negrita.' },
    { icon: '📧', name: 'Email Profesional', prompt: 'Convierte esta nota en un email profesional listo para enviar, con asunto, saludo y cierre adecuados.' },
  ]
}, {
  label: '💄 Embellecer',
  color: 'purple',
  actions: [
    { icon: '🏗️', name: 'Agregar Estructura', prompt: 'Reorganiza este texto con encabezados Markdown, listas y tablas donde corresponda. Mejora el formato sin cambiar el contenido.' },
    { icon: '✨', name: 'Mejorar Redacción', prompt: 'Mejora el estilo, la claridad y la fluidez del texto manteniendo el tono y las ideas originales.' },
    { icon: '🎨', name: 'Agregar Emojis', prompt: 'Agrega emojis apropiados y visuales a los títulos y puntos clave para hacer la nota más dinámica y atractiva.' },
    { icon: '📊', name: 'Agregar Tabla', prompt: 'Identifica los datos comparativos o estructurados del texto y preséntales en una tabla Markdown bien formateada.' },
  ]
}, {
  label: '🌐 Otros',
  color: 'emerald',
  actions: [
    { icon: '🔍', name: 'Desarrollar Ideas', prompt: 'Expande los puntos incompletos y agrega profundidad y detalle a las ideas que parecen bocetos o fragmentos.' },
    { icon: '🌐', name: 'Traducir al Inglés', prompt: 'Traduce toda la nota al inglés profesional, manteniendo el formato Markdown original.' },
  ]
}, {
  label: '🎓 Asistente Técnico',
  color: 'purple',
  actions: [
    { icon: '⚖️', name: 'Entrevista Socrática', prompt: 'REPLY: Actúa como un mentor socrático y un "Abogado del Diablo". Analiza mi tratado y desafía mis premisas. Hazme 3 preguntas críticas que pongan a prueba la lógica de mi argumento y me obliguen a expandir mi tesis con más rigor técnico.' },
    { icon: '🖇️', name: 'Jerarquía Lógica', prompt: 'REPLY: Analiza la jerarquía de conceptos de este escrito. ¿El orden lógico es correcto? ¿Hay conceptos complejos que se introducen sin base previa? Genera un mapa de dependencias lógicas y sugiere si algún apartado debería moverse para mejorar la fluidez del tratado.' },
    { icon: '📚', name: 'Glosario Técnico', prompt: 'REPLY: Escanea este tratado y extrae una taxonomía de términos técnicos clave. Para cada término, genera una definición precisa basada en el contexto del documento y sugiéreme dónde incluir un glosario o referencias cruzadas para mejorar la claridad técnica.' },
    { icon: '🧪', name: 'Síntesis de Fuentes', prompt: 'REPLY: Basándote en el contenido actual y cualquier nota del @vault relevante, sintetiza una base sólida para el siguiente apartado del tratado. Asegúrate de mantener la integridad técnica y la cohesión con los argumentos ya establecidos.' },
  ]
}];

export const AiQuickActions = ({ onPromptSelected, isDark }: { onPromptSelected: (p: string) => void, isDark: boolean }) => {
  return (
    <>
      <div className="flex flex-col items-center gap-2 opacity-40 py-2">
        <Sparkles size={24} />
        <p className="text-[11px] text-center px-4">Ask anything or use a Quick Action to transform your note.</p>
      </div>

      {QUICK_ACTIONS.map(category => (
        <div key={category.label} className="px-3">
          <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${
            category.color === 'blue' ? 'text-blue-400' :
            category.color === 'purple' ? 'text-purple-400' : 'text-emerald-400'
          } opacity-70`}>{category.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {category.actions.map(action => (
              <button
                key={action.name}
                onClick={() => onPromptSelected(action.prompt)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all hover:scale-105 active:scale-95 ${
                  isDark
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                    : 'bg-black/5 border-black/10 hover:bg-black/10 text-black/70'
                }`}
              >
                <span>{action.icon}</span>
                <span>{action.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
};
