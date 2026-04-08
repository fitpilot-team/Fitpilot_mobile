
La revisión de Fitpilot_mobile y Fitpilot_training_backend deja una foto bastante clara: la página de Entrenamientos ya tiene una base sólida, pero hoy está construida alrededor de una sola lectura del progreso: carga movida por rangos de repeticiones. Eso funciona bien para un enfoque de doble progresión orientado a hipertrofia, pero se queda corto para fuerza, para ejercicios sin carga externa y para escalar la analítica con más historial.
Diagnóstico general
La página actual está bien resuelta en términos de navegación: tiene tres vistas (Resumen, Ejercicios, Historial), selector de ventana temporal, búsqueda/orden de ejercicios, historial paginado y un detalle por ejercicio con gráfica propia. Además, el backend ya expone endpoints separados para dashboard, historial, detalle por ejercicio y preferencias de rangos, lo cual es una buena base para evolucionar sin romper toda la pantalla.
El problema es que casi toda la lógica analítica gira en torno a estas ideas:
•	volumen = reps_completed * weight_kg
•	agrupación por rangos de repeticiones
•	progreso de ejercicio = mejor carga reciente, delta entre los últimos dos puntos, y una sparkline de esos pesos
•	detalle del ejercicio = mejor carga, volumen, y bucket dominante del día
Eso hace que la experiencia actual sea útil, pero muy sesgada hacia hipertrofia con carga externa.
Hallazgos importantes
Hay una inconsistencia semántica en el dashboard: el hero habla de “Resumen del periodo”, pero en backend summary.total_sessions y recent_history se calculan sobre todo el historial elegible hasta la fecha ancla, mientras que sessions_in_range, active_days, total_volume_kg, exercise_summaries y rep_range_chart sí usan la ventana seleccionada. En otras palabras, la UI parece “por rango”, pero parte del contenido sigue siendo “histórico total”.
También hay una limitación fuerte: la analítica ignora series sin peso válido, porque el volumen ponderado devuelve 0 cuando weight_kg es None o <= 0. Eso deja mal representados ejercicios como dominadas, fondos, variantes con banda, peso corporal y parte del trabajo accesorio. Incluso la documentación del backend marca weight_kg como nullable para peso corporal.
Otro punto: el detalle del ejercicio reduce cada fecha a un solo reps_bucket_id, el bucket dominante de ese día. Si en una sesión hubo top set pesado + backoffs a más reps, la visualización lo aplana y se pierde mucha señal valiosa para fuerza.
Y el punto más importante para escalabilidad: el backend está cargando todos los workout logs autoritativos del cliente con joins a sets y training day, y luego filtra/agrupa en Python para dashboard, history y exercise detail. Eso es correcto funcionalmente, pero conforme crezca el historial de un usuario, esta pantalla se va a volver cada vez más costosa.
Oportunidades de mejora en UX/UI y visualización
1. Alinear el significado del rango temporal
Hoy el selector de ventana no se siente 100% confiable porque unas tarjetas obedecen el rango y otras no. La primera mejora debería ser decidir entre dos caminos:
•	que todo el dashboard respete la ventana actual, o
•	que haya un contraste explícito entre “En la ventana” y “Histórico total”.
Ahora mismo está mezclado, y eso puede confundir al usuario aunque los datos estén “correctos”.
2. Pasar de “una sola métrica de progreso” a “capas de progreso”
En el detalle del ejercicio hoy solo ves línea de mejor carga y barras de volumen. Para hipertrofia sirve, pero para fuerza y lectura más fina faltan capas como:
•	mejor carga
•	volumen
•	rep PR
•	e1RM
•	intensidad relativa
•	esfuerzo medio real (RIR/RPE registrado)
•	cumplimiento respecto a lo prescrito
La vista ideal no debería obligar al usuario a interpretar todo desde kilos y volumen solamente.
3. Hacer que “Ejercicios” sea más accionable
La lista actual ordena por recientes, mayor progreso o frecuencia, pero “mayor progreso” se apoya en best_weight_delta_kg entre los últimos dos puntos ponderados. Eso puede ser ruidoso y favorecer ejercicios con pocas exposiciones o cambios bruscos.
Sería mejor mostrar en cada card algo como:
•	última sesión vs mejor histórico
•	tendencia 2w / 8w
•	PR reciente
•	estado del ejercicio: subiendo / estable / estancado / regresando
•	etiqueta del modelo: hipertrofia / fuerza / técnica
4. Mejorar la explicación visual del gráfico por rangos
El gráfico de “Kg movidos por rango” está bien implementado como stacked bars semanales, pero depende de buckets editables por el usuario, así que necesita más contexto visual: qué significa cada color, por qué ciertas semanas tienen 0, y qué lectura se espera de ese gráfico. Hoy comunica datos, pero no necesariamente comunica insight.
Mejoras en estructura de datos y flujo
La buena noticia es que la base de datos y el dominio ya tienen piezas para soportar más modelos.
El modelo de DayExercise ya soporta effort_type con valores RIR, RPE y percentage, junto con effort_value, reps_min, reps_max y otros campos de configuración. O sea: el sistema ya sabe programar ejercicios con lógica de fuerza basada en % del 1RM.
Además, ExerciseSetLog ya guarda reps_completed, weight_kg y effort_value, y el sistema de workout logging ya soporta segmentos por serie. Eso abre la puerta a analizar top sets, backoffs, cluster sets, rest-pause y otras estructuras sin rediseñar desde cero el registro de ejecución.
Lo que sí falta a nivel de modelo analítico
Falta una capa explícita que diga cómo debe interpretarse el progreso. Hoy existen datos para programar distintos métodos, pero la analítica los lee casi siempre como hipertrofia basada en carga + bucket de reps.
Yo propondría agregar un concepto como:
•	progression_model por ejercicio o por bloque
•	ejemplos:
o	double_progression_hypertrophy
o	percentage_1rm_strength
o	rpe_strength
o	density_conditioning
o	bodyweight_progression
Y junto con eso, un pequeño contrato analítico configurable:
•	métrica principal
•	métricas secundarias
•	unidad
•	reglas de PR
•	fórmula derivada permitida (e1RM, intensidad relativa, etc.)
Eso evita que la pantalla “Entrenamientos” esté amarrada para siempre a rep buckets.
Ideas para soportar múltiples modelos de progresión
Modelo 1: Hipertrofia / doble progresión
Mantener lo actual, pero enriquecerlo con:
•	rep range compliance
•	mejor set dentro del rango objetivo
•	tiempo en rango
•	volumen por ejercicio y por músculo
•	detección de salto de carga después de tocar techo del rango
Modelo 2: Fuerza basada en %1RM
Como el sistema ya soporta effort_type = percentage, la vista debería poder mostrar:
•	top set del día
•	e1RM por sesión
•	intensidad media y máxima (% estimado)
•	exposiciones por zona de intensidad (ej. 70-79, 80-89, 90+)
•	cumplimiento de prescripción: % planeado vs % ejecutado
•	top set + backoff relationship
Modelo 3: Fuerza basada en RPE/RIR
Usando effort_value prescrito y registrado:
•	desviación entre esfuerzo planificado y real
•	series duras acumuladas
•	tendencia de e1RM ajustada por RPE
•	rep PRs a RPE similar
Modelo 4: Peso corporal / carga no externa
Aquí conviene dejar de depender solo de weight_kg y considerar:
•	reps máximas
•	densidad (más reps en mismo tiempo)
•	lastre o asistencia
•	e1RM relativo cuando exista lastre
•	clasificar el progreso aunque weight_kg sea null
Plan de optimización priorizado
PrioridadIniciativaImpactoComplejidadP0Corregir consistencia del rango temporal en dashboardAltoBajaP0Rehacer ranking de ejercicios con señal más robusta que solo best_weight_delta_kgAltoMediaP0Agregar selector de métrica en detalle del ejercicio: carga / volumen / e1RM / reps / esfuerzoAltoMediaP1Soportar ejercicios sin carga externa en analíticaAltoMedia-AltaP1Introducir progression_model y contrato analítico por ejercicio/bloqueMuy altoAltaP1Exponer métricas de fuerza: e1RM, intensidad relativa, zonas, top set/backoffsMuy altoMedia-AltaP2Llevar filtros/agregaciones al SQL o preagregados, en vez de cargar todo y procesar en memoriaMuy altoAltaP2Crear vistas por microciclo/mesociclo/bloque, no solo ventanas 4w/8w/12w/allAltoMediaP2Añadir benchmark contra prescripción: planeado vs ejecutadoAltoMediaRecomendación concreta de implementación
Yo lo haría en 3 fases.
Fase 1: mejorar lo actual sin cambiar el paradigma
•	hacer consistente la ventana temporal
•	mejorar el score de progreso de ejercicios
•	enriquecer el detalle con más métricas seleccionables
•	dejar más claro qué significa cada tarjeta y cada gráfico
•	evitar que el usuario piense que todo es “PR de peso”
Fase 2: volver la analítica agnóstica al modelo
•	introducir progression_model
•	separar visualización de datos de la lógica de hipertrofia
•	crear series genéricas tipo:
o	metric_type
o	unit
o	aggregation
o	display_hint
Con eso, la pantalla puede renderizar hipertrofia, fuerza o densidad sin rehacerse cada vez.
Fase 3: escalar backend y enriquecer negocio
•	preagregados por usuario / ejercicio / semana
•	series por ejercicio cacheadas
•	soporte completo de e1RM y %1RM
•	planned vs actual
•	integración por bloque o fase del programa
Conclusión
Mi lectura es esta:
La página ya está bien encaminada como dashboard de progreso para hipertrofia, pero hoy todavía no es una capa analítica realmente general.
El mayor cuello de botella no está en la UI, sino en que la analítica sigue leyendo el progreso casi solo como peso + volumen + bucket de reps. Mientras eso no se abstraiga, cualquier soporte serio para fuerza o periodización avanzada va a sentirse añadido “encima”, no integrado.
La ventaja es que el dominio ya trae varias piezas clave: programación por RIR/RPE/percentage, logs con reps/peso/esfuerzo y soporte de series segmentadas. O sea, no necesitas reinventar el sistema; necesitas replantear la capa analítica y la semántica de la pantalla.

