---
title: "BoBClaw: un sustrato de agentes soberano y centrado en el harness"
description: "El whitepaper técnico. Cómo BoB ofrece ejecución de horizonte largo de clase frontera y razonamiento verificable sobre modelos de consumo que tú posees."
category: "Papers"
format: "Write-up"
date: 2026-06-30
order: 1
---

## Resumen

La forma dominante de usar muchos modelos de lenguaje hoy es la *agregación*: un único endpoint que enruta una solicitud al modelo que nombres. Eso ya es un commodity. Resuelve el "un solo lugar para todo" y nada más, y no ofrece protección alguna cuando el único modelo del que depende tu flujo de trabajo queda obsoleto, se le cambia el precio o, como ocurrió el **12 de junio de 2026**, es retirado por orden gubernamental.

BoBClaw es la capa por encima de la agregación. Es un sustrato de agentes centrado en el harness, construido sobre una única tesis: **la fiabilidad y la capacidad pertenecen al andamiaje, no al modelo.** Trata al modelo como una CPU intercambiable; pon el valor diferenciado (verificación, orquestación, memoria y gobernanza) en el harness que lo rodea. Hecho correctamente, una flota de modelos de consumo y de pesos abiertos, debidamente orquestada y verificada de forma adversaria, entrega las dos cosas que de verdad importan para el trabajo agéntico, **la ejecución de horizonte largo** y **el razonamiento verificable y de grado de seguridad**, a una fracción del coste de frontera, sin dependencia de proveedor y sin nada que pueda ser prohibido por controles de exportación.

Esto no es un documento de opinión. El sustrato que aquí se describe se construyó en gran medida a sí mismo: a lo largo de *cuatro* ejecuciones de ingeniería autónomas de varias horas produjo 789 pruebas nuevas sin regresiones, sobre inferencia de consumo, por unos pocos dólares cada una. Su columna de verificación, un harness de honestidad real y sin modelo, atrapó toda afirmación falsa plantada de forma adversaria en el conjunto sembrado de la ejecución en vivo, y una revisión adversaria dirigida atrapó una vía real de ejecución remota de código a nivel de host antes de la fusión. La arquitectura es el argumento.

---

## 0. El momento: la capacidad que alquilas es capacidad que se te puede revocar

El **9 de junio de 2026**, Anthropic lanzó Fable 5 y Mythos 5, sus modelos más capaces hasta la fecha. Tres días después, el **12 de junio a las 5:21 PM ET**, el gobierno de EE. UU. emitió una directiva de control de exportaciones que exigía a Anthropic suspender el acceso a *cualquier ciudadano extranjero, dentro o fuera de Estados Unidos*, incluidos los propios empleados de Anthropic con nacionalidad extranjera. El cumplimiento no podía hacerse de forma selectiva, así que los modelos quedaron a oscuras **para todos los clientes**. La preocupación declarada: un jailbreak que podría exponer la capacidad de Fable 5 de **identificar y explotar vulnerabilidades de software de forma autónoma**.

Detente a considerar la forma de ese evento:

- **La capacidad prohibida es la capacidad agéntica.** Fable no fue restringido por escribir ensayos. Fue restringido porque era *demasiado capaz en trabajo de seguridad autónomo y de horizonte largo*, precisamente la clase de capacidad que define a un agente serio.
- **Pagar no te protegió.** Los suscriptores de Max y Enterprise perdieron el acceso de un día para otro. Alquilar no es poseer.
- **La geografía decide.** Cuando el acceso volvió parcialmente, volvió para unas 100 instituciones estadounidenses. Si estás fuera de ese círculo, un ciudadano extranjero, una empresa no estadounidense, un desarrollador en Bangkok, los modelos más capaces, por política, no son tuyos para usar.

Esto ya no es un riesgo hipotético que haya que cubrir. Es un modo de fallo demostrado de construir tu agente sobre un único modelo de frontera alquilado. La pregunta que todo constructor serio tiene ahora que responder es: **¿qué es tu agente el día en que el modelo que hay detrás es prohibido, queda obsoleto o su precio se vuelve inalcanzable?**

La respuesta de un agregador es "enruta a un modelo distinto", pero si tu flujo de trabajo *dependía de una capacidad de clase Fable*, enrutar a un modelo más débil es degradación, no continuidad. La respuesta de BoBClaw es distinta, y es el tema de este documento: **la capacidad nunca vivió en un solo modelo para empezar.**

---

## 1. La agregación es lo mínimo; el producto es la capa de encima

Un agregador de modelos te da una sola API para muchos modelos. Eso es genuinamente útil y está genuinamente comoditizado, OpenRouter, LiteLLM y una docena de otros lo hacen. Es el "castillo en miniatura": un solo lugar para todo. No hace fuerte a un modelo débil, no saca adelante por sí solo trabajo de varios pasos, y no te hace soberano, solo intermedia el acceso.

BoBClaw es la capa de encima. Su valor es todo lo que va *más allá* del "un solo lugar para todo", y se apoya en tres adiciones:

1. **La verificación hace confiables a los modelos baratos.** La salida de un modelo de consumo solo vale tanto como tu capacidad de saber cuándo se equivoca. BoBClaw trata cada afirmación con consecuencias y cada acción como una hipótesis que debe ser *verificada de forma adversaria por una familia de modelos distinta* antes de que se le permita mantenerse en pie (§4). Esto es lo que convierte "barato pero poco fiable" en "barato y confiable".
2. **La orquestación saca adelante trabajo real.** Una única llamada enrutada responde una pregunta. Una flota, un planificador ápice, gestores, trabajadores y críticos, coordinada sobre un ledger duradero, completa un *proyecto*: descomponer, desplegar en abanico, construir, probar, reparar, verificar, fusionar (§3, §5).
3. **La disciplina de clase de capacidad lo hace soberano.** Ningún backend se nombra en la lógica. Los roles solicitan *clases de capacidad* con cadenas de reserva. Prohíbe un modelo, pierde una clave o presencia una subida de precios, y la clase se vuelve a resolver hacia el siguiente proveedor, local si es necesario. El sistema sobrevive a la pérdida de cualquier proveedor individual, incluido el que lo orquesta (§9).

### La tesis centrada en el harness

El planteamiento convencional trata al modelo como el producto y al código que lo rodea como pegamento. BoBClaw lo invierte: **el harness es el producto; el modelo es una CPU intercambiable.** La fiabilidad, la autonomía, la memoria y la gobernanza son propiedades del andamiaje, diseñadas y probadas como cualquier otro sistema. El modelo aporta la inteligencia bruta; el harness aporta todo lo que hace que esa inteligencia sea *fiable y apropiable*.

La consecuencia es la afirmación central de este documento: **no necesitas poseer un modelo de frontera para obtener resultados agénticos de clase frontera. Necesitas poseer el harness.**

> **Alcance honesto.** No afirmamos que los modelos subyacentes de BoBClaw igualen la inteligencia bruta de Fable 5 en un benchmark equivalente, y este documento no hace tal medición. La afirmación es más acotada y defendible: los *resultados que importan para el trabajo agéntico*, la ejecución sostenida de varios pasos y la revisión verificable de grado de seguridad, son alcanzables de forma reproducible mediante orquestación y verificación sobre modelos que no están, ni pueden estar, sujetos a controles de exportación.

---

## 2. Visión general del sistema

BoBClaw son cuatro servicios cooperantes más un pequeño conjunto de daemons de apoyo.

| Servicio | Rol | Puerto por defecto |
|---|---|---|
| **core** | El motor de orquestación. Un grafo de agentes compilado: enrutamiento, despacho, la topología trabajador/gestor/crítico, los backends de modelos, la columna de verificación, la memoria, el presupuesto y el ledger duradero. | 7825 |
| **gateway** | API REST + WebSocket e interfaz web. Autenticación JWT/TOTP, conversaciones, proyectos, aprobaciones, equipos, vista de enrutamiento, inspección de memoria. | 7826 |
| **claude-pipeline** | Un envoltorio ligero invocado como subproceso para los niveles de planificación impulsados por CLI. | (subproceso) |
| **app** | Un cliente de escritorio Kotlin Multiplatform, el uso diario: chat en streaming, historial de conversaciones, un lienzo de artefactos, la vista de enrutamiento/JOAT y un constructor de equipos. | (nativo) |

Daemons de apoyo (todos opcionales, todos intercambiables): **Postgres** (estado de producción; SQLite en la ruta caliente), **Qdrant** (vectores), **Redis** (pins de throttling y una caché de salud de TTL corto) y **hosts de modelos locales** (`llama.cpp` / Ollama / LM Studio) para embeddings, extracción e inferencia en dispositivo.

Todo lo sustancial ocurre dentro del **grafo compilado de core**: un turno de usuario entra, se enruta a una face/backend, se despacha, opcionalmente se despliega en abanico por una flota, se verifica y se confirma en un ledger de solo anexado que es la verdadera memoria del sistema. Las secciones restantes recorren las partes de ese grafo que constituyen la "capa por encima de la agregación".

---

## 3. Orquestación de flota: roles, equipos y descorrelación

La agregación enruta una *llamada*. BoBClaw enruta un *rol dentro de un equipo*.

**Roles.** El trabajo se expresa en tres roles, **apex** (el planificador/orquestador que descompone una tarea y sintetiza resultados), **worker** (subagentes que hacen la labor) y **critic** (auditores adversarios). Un rol se resuelve a un backend concreto mediante una capa de enrutamiento (`core/teams.py`), no queda codificado de forma fija en el punto de la llamada.

**Backends.** El sustrato habla con un conjunto amplio y deliberadamente heterogéneo de proveedores: Qwen local vía `llama.cpp`, DeepSeek V4 (el caballo de batalla de mano de obra barata), Kimi (coordinación de nivel de planificación), GLM (nivel de auditoría/crítica), Gemini, la familia Claude (suscripción por CLI o API), Codex, MiniMax, Ollama, LM Studio y un pool local de OpenCode. Los nuevos backends son adiciones locales a archivos bajo `core/backends/`; la topología no cambia cuando se añade o se elimina uno.

**Equipos y perfiles.** Un *equipo* es una plantilla rol→backend (p. ej. apex=Kimi, worker=DeepSeek, critic=GLM). Un *perfil* (o "face", unos 19 incluidos) superpone el **cómo** sobre un rol: prompt de sistema, backends preferidos y de escalado, postura y límites. Los equipos son editables por el usuario como YAML; los perfiles se validan y se versionan. Esto es lo que permite que la misma tarea se ejecute como un único trabajador barato, un despliegue en abanico de docenas o un consejo deliberante de múltiples asientos, por configuración en lugar de por código.

**Descorrelación entre familias, el principio de diseño que hace significativa a la verificación.** Los backends se agrupan en *familias* (`FAMILY_BY_BACKEND`). La regla: **un crítico debe provenir de una familia distinta a la del actor que audita.** Un trabajador DeepSeek nunca es revisado por otra instancia DeepSeek; es revisado por GLM o Claude. El escalado dentro de la misma familia está prohibido por construcción. Los errores correlacionados, el modo de fallo en el que un modelo sella con confianza su propia clase de error, se eliminan por diseño, no se dejan a la esperanza. Este principio es lo que le da dientes a la §4.

**Enrutamiento consciente de la salud.** Una sonda de salud en vivo (`core/health_probe.py`, cableada en el arranque) refleja la ruta de llamada real de cada backend, cachea los resultados brevemente y falla en abierto. Cuando un backend preferido está limitado o caído, el router recorre la cadena de escalado en lugar de quedarse parado.

---

## 4. La columna de verificación: donde lo barato se vuelve confiable

Este es el diferenciador. La mayoría de los sistemas generan, y luego muestran. BoBClaw genera, luego **verifica de forma adversaria contra un crítico descorrelacionado**, luego muestra, y trata "no se pudo verificar" como un desenlace de primera clase que no supone fallo, en lugar de un pase silencioso.

La columna tiene cuatro partes, cada una un módulo probado, usadas por *ambas* la vía de investigación y la vía de GUI:

- **Comprobación de poscondición descorrelacionada** (`core/verify/postcondition.py`). Después de que un paso afirme un desenlace, se pregunta a un crítico *de una familia de modelos distinta* si el desenlace realmente se cumple. Solo pasa un veredicto explícito `HOLDS`; cualquier otra cosa falla de forma segura. (61 pruebas.)
- **Compuerta de implicación de afirmaciones** (`core/verify/entailment.py`), el motor. Toda afirmación cuantitativa se modela como un `Claim(subject, predicate, value, cited_source)`. La compuerta **vuelve a abrir la fuente citada** y pregunta a un crítico entre familias, *"¿respalda realmente esta fuente este número?"*, devolviendo `ENTAILED` / `NOT_ENTAILED` / `UNKNOWN`. Una afirmación que cita una fuente que no la respalda no llega a enunciarse. El motor está construido, probado y demostrado en ejecuciones de extremo a extremo para atrapar afirmaciones erróneas pero plausibles. *Alcance honesto:* es código de biblioteca invocado donde se cablea, aún no disparado automáticamente sobre cada afirmación en cada ruta de producción; y "ningún sistema comercial incorpora implicación de fuente por afirmación" es una tesis de diseño que creemos que se sostiene, no un estudio de mercado con benchmarks. (52 pruebas.)
- **Compuerta de reintento externalizada (ERG)** (`core/ledger/erg.py`). El estado de rechazo vive *fuera* del contexto del trabajador. Ante un fallo de implicación, la tarea se vuelve a ramificar con *solo una señal de restricción negativa*, "esta bid-key falló; estas fuentes se probaron", y ningún razonamiento cualitativo, de modo que no se puede convencer al trabajador de caer en el mismo error. Tras un número acotado de intentos confirma `[UNVERIFIED: EXHAUSTED_SEARCH]` y saca a la superficie la laguna como un **desconocido conocido**. Las razones de fallo son un enum acotado (`TEMPORAL_SCOPE_MISMATCH`, `WRONG_ENTITY`, `STALE_SOURCE`), nunca texto libre.
- **Terminación con FALLO por defecto** (`core/verify/termination.py`, `core/ledger/mergegate.py`). Todo criterio de finalización empieza en `verified = False`. Un resultado se fusiona solo cuando **todos** los criterios están verificados o explícitamente etiquetados como agotados. El conjunto vacío no pasa. La finalización es algo que se *gana*, no lo predeterminado.

**El resultado medido, enunciado con precisión.** La propia métrica de honestidad es medible: `false_pass_rate` (`core/ses/falsepass.py`) es un harness real y sin modelo que puntúa la fracción de afirmaciones *deliberadamente plantadas, plausibles pero erróneas* que un crítico deja pasar por error. En la ejecución en vivo de extremo a extremo, un crítico entre familias real produjo **cero pases falsos sobre el conjunto plantado**, pero ese conjunto era pequeño y escrito a mano (un puñado de elementos), así que la afirmación honesta es "el harness *mide* la tasa de pases falsos y el crítico puntuó limpio sobre el conjunto plantado", no "una tasa garantizada del 0 %". Endurecerlo requiere un corpus plantado mayor y ejecutable por terceros. El punto se sostiene en cualquier caso: los modelos baratos no se *confían*, se *comprueban*, por una familia distinta, con un sesgo de fallo por defecto.

---

## 5. La vía de construcción: construcción centrada en contratos con una compuerta de verificación aislada

La vía de construcción es la demostración más clara de la revisión de "grado de seguridad", porque aquí el sistema ejecuta código que escribió un modelo.

La ruta del grafo es: `build_request → plan_contracts → dispatch → worker ×N → join → verify → {repair → verify}* → END`.

- **Contratos primero** (`core/nodes/build_plan.py`). Un nivel de planificación acuña contratos, firmas de interfaz y comportamiento esperado, *antes* de cualquier implementación. El planificador escribe especificaciones, no código.
- **Los trabajadores implementan** contra los contratos (backends de consumo).
- **La compuerta de verificación ejecuta el código escrito por el modelo en un sandbox Docker blindado** (`core/build/sandbox.py`): `--network none`, `--cap-drop ALL`, un montaje de espacio de trabajo de solo lectura, memoria/PIDs/CPU limitados, `--rm`. Se ha **demostrado empíricamente que bloquea lecturas de secretos del host y la exfiltración por red**. La compuerta es el *único* emisor de un veredicto de pase/fallo (exactamente una vez), nunca edita la prueba para hacerla pasar, y una especificación defectuosa permanece *a la vista* en lugar de ser absorbida en silencio.
- **Los bucles de reparación** regeneran contra la misma compuerta hasta que estén en verde o se agoten.

**Prueba, no promesa.** En una ejecución en vivo de extremo a extremo, 8 contratos produjeron 8 implementaciones que se construyeron, se ejecutaron y pasaron 8/8 pruebas, con aislamiento total en sandbox. Una posterior revisión de código de máximo esfuerzo y *dirigida* de la rama completa **atrapó un RCE real a nivel de host**, una firma de contrato sin filtrar que se importaba en el host, más una vía de falso verde y una corrupción de parseo, todo *antes* de la fusión. La postura de seguridad es de dos capas, y ninguna de las dos confía en el modelo: una *revisión adversaria dirigida* es lo que **atrapó** el RCE (detección), y el sandbox Docker es lo que **contiene** el código escrito por el modelo en tiempo de ejecución (mitigación). El encuadre honesto: la compuerta *asume* mal comportamiento y la revisión lo *caza*, no que la compuerta autónoma detectara el RCE por sí sola.

---

## 6. La vía de investigación: razonamiento con citas, verificado por afirmación

La vía de investigación es un bucle orquestador-trabajador con reconstrucción iterativa por rondas, y es donde la compuerta de implicación (§4) se convierte en una garantía de cara al usuario.

- Los trabajadores recuperan **primero de LKS** (el sustrato de conocimiento local, §8) antes de recurrir a la web abierta, de modo que el razonamiento se ancla en conocimiento propio y duradero.
- Una **disciplina de citas** vincula cada afirmación cuantitativa a una fuente, y la compuerta de implicación vuelve a abrir esa fuente y comprueba el respaldo antes de que se permita a la afirmación entrar en la salida.
- La terminación es adversaria y de fallo por defecto: el bucle termina cuando los criterios están verificados u honestamente marcados como desconocidos, no cuando el modelo se declara terminado.

El contrato de salida es, por tanto, inusualmente fuerte: los números que sobreviven hasta la página han tenido sus fuentes citadas releídas por un crítico descorrelacionado, y los números que no pudieron sustanciarse aparecen como desconocidos conocidos explícitos en lugar de fabricaciones seguras de sí mismas.

---

## 7. La vía de uso de computadora por GUI: actúa, luego verifica que el mundo cambió

Operar una interfaz real es donde los agentes con más frecuencia "tienen éxito" sobre el papel mientras fracasan en la realidad. La vía de GUI de BoBClaw (`core/gui/`) aplica la misma disciplina centrada en el harness y de fallo por defecto a los píxeles y los árboles de accesibilidad.

El bucle interno es **capturar → anclar → actuar → verificar**, construido de abajo hacia arriba como lógica determinista y sin modelo antes de introducir cualquier modelo:

- **Los fotogramas cargan estructura, no bytes**, un hash de píxeles más un índice de accesibilidad, que habilitan diffs baratos e independientes del orden de "¿cambió algo realmente?" (`core/gui/framediff.py`).
- **Las poscondiciones se comprueban después de cada acción** (`core/gui/verify.py`): una condición vacía/incumplida falla *en cerrado*; las condiciones semánticas ("el archivo se guardó", "la fila correcta está seleccionada") se escalan al crítico descorrelacionado de la §4.
- **Un resolvedor determinista de nivel de acción** (`core/gui/tiers.py`) clasifica cada acción y herramienta en niveles obligatorios (solo lectura / escritura local / social / acceso total). Las acciones de acceso total se enrutan a una interrupción humana mecánica, ningún modelo llega a decidir que una acción irreversible está bien.
- **Un detector de atasco de cinco señales** (`core/gui/stuck.py`), sin progreso, repetición de acción, presupuesto de pasos, presupuesto de tiempo, racha de vetos, detiene los bucles de forma determinista, sin ningún modelo en la decisión.

El patrón es coherente en las tres vías: el modelo propone; las compuertas deterministas y los críticos descorrelacionados disponen; "terminado" se gana contra poscondiciones verificadas.

---

## 8. El sustrato de memoria y conocimiento

Un agente sin memoria duradera vuelve a derivar las mismas conclusiones para siempre. La memoria de BoBClaw está diseñada de modo que el razonamiento *se compila una vez y se mantiene al día.*

**La arquitectura de conocimiento** (los cimientos puestos en el whitepaper de conocimiento v1.0, ahora parte de este sistema). El conocimiento se compila en almacenes estructurados y persistentes en lugar de volver a recuperarse de documentos en bruto por consulta; las personas y los proyectos son entidades de primera clase con contexto acumulativo; y una *jerarquía de agentes de lint*, modelos pequeños de menos de 2B para monitoreo continuo de bajo coste, modelos de gama media para análisis sustantivo, modelos de frontera para el reconocimiento de patrones entre sistemas, actúa como un sistema inmune que mantiene coherente la base de conocimiento y permite que el agente mejore a partir de su propio historial operativo.

**El módulo de memoria en tiempo de ejecución** (`core/memory/`). Un registro de eventos L0 de solo anexado (SQLite), extracción de hechos L1 en segundo plano (un pequeño modelo local), deduplicación basada en huellas, y un paso de recuperación que empalma los hechos relevantes en el prompt antes del despacho y **falla en abierto**, un vector ausente se omite, nunca es fatal.

**Convergencia hacia un único sustrato duradero (LKS).** En lugar de mantener para siempre una implementación de memoria paralela, BoBClaw está convergiendo su memoria hacia el Local Knowledge Substrate mediante un puente de lectura/escritura protegido (`core/memory/lks_adapter.py`, `write_fence.py`): una guarda de vector cero, una huella de embedding que estampa la versión en las colecciones, un adaptador de lectura y una barrera de escritura de escritor único, consolidados sobre un único almacén de vectores.

**El ledger es el sistema de registro** (`core/ledger/`, `core/harness/`). El estado es un DAG de commits de solo anexado nativo de git, un commit por trayectoria en la fusión. El contexto se reconstruye *rebanando el ledger*, no confiando en lo que quede por casualidad en la ventana de contexto de un modelo, y las notas de fallo estructuradas siempre sobreviven a la compactación. Un supervisor (`core/harness/supervisor.py`) trata a un subagente muerto como un error reintentable ("ganado, no mascotas") y puede reproducir y reanudar desde el ledger. Esta es la capa de durabilidad que hace posible la autonomía de horizonte largo (§9) sin un humano cuidando el contexto.

---

## 9. Soberanía y economía

Todo lo anterior converge en dos propiedades que la agregación por sí sola no puede proporcionar.

### 9.1 La soberanía como propiedad derivada

Como ningún backend se nombra en la lógica, solo roles resueltos a clases de capacidad con cadenas de reserva (`core/teams.py`), el **sustrato entregado no tiene ninguna dependencia dura de ningún modelo o proveedor concreto**. Esa es la afirmación precisa y defendible. Aquí está exactamente lo que significa y lo que no significa:

- **El nivel de mano de obra estuvo verificablemente libre de frontera.** A lo largo de ambas ejecuciones autónomas (§10), el nivel de construcción estuvo *LIBRE DE CLAUDE por construcción y verificado por sprint*: los modelos de consumo (DeepSeek, GLM, Kimi) redactaron y auditaron de forma adversaria cada línea; el modelo de frontera (Opus) solo **condujo y gestionó**, nunca escribió código de producción. La inteligencia cara no era portante para la *mano de obra*.
- **Pero "de consumo" no es "autoalojable", y no vamos a difuminar las dos.** DeepSeek, GLM y Kimi son APIs en la nube, no pesos abiertos que ejecutes tú mismo; solo los backends `local` (llama.cpp/Qwen), `opencode` y `codex` son verdaderamente autoalojables. Y las ejecuciones *demostradas* usaron un ápice Claude para la orquestación, con algunas cadenas de escalado integradas recurriendo a `claude_api`. Una construcción *de extremo a extremo* totalmente aislada de red y libre de frontera está soportada por la arquitectura, pero aún no es una demostración destacada.
- **La resiliencia es arquitectónica, no una única ruta mágica.** Prohíbe un modelo, pierde una clave o presencia una subida de precios, y la clase de capacidad se vuelve a resolver hacia el siguiente proveedor, hasta la inferencia local si la cadena está configurada de esa forma. Ningún proveedor individual es *estructuralmente* portante. *Esa* es la propiedad que sobrevive a una prohibición de exportación, no una afirmación de que BoBClaw nunca toque un modelo de frontera.

Por eso la especificación que define este sistema ya citaba la suspensión como fundamento de diseño **antes de que se escribiera este documento**: *"La suspensión de Fable 5 / Mythos 5 del 12 de junio de 2026 dejó fuera de línea un modelo desplegado para toda su base global de usuarios en cuestión de horas mediante una única directiva."* La soberanía fue la premisa de diseño; la noticia la confirmó.

### 9.2 La economía

El nivel caro es la orquestación y la adjudicación; la mano de obra portante tiene precio de consumo. Medido sobre la ejecución de construcción autónoma (§ abajo), amortizado:

| Nivel | Rol | Coste amortizado | Base |
|---|---|---|---|
| DeepSeek V4 Flash | Trabajador, escribió todo el código + 294 pruebas | **< $1** | Coste marginal PAYG real |
| Kimi | Ápice, coordinación de despliegue en abanico | **~$0.46** | ~5 % de una semana en un plan de $40/mes |
| GLM 5.2 | Crítico, auditoría adversaria | **~$0.15** | ~1 % de una semana en un plan de $65/mes |
| Claude Opus | Conductor + gestores, solo orquestación | **~$2** | **~9 % de una semana** en un plan Max de $100/mes |
| **Total** |, | **~$3-4** | por una construcción autónoma de ~5 horas |

> **Corrección anotada (2026-06-30):** una retrospectiva anterior amortizó el nivel Claude contra el plan *mensual* y reportó ~$9. La base correcta es ~9 % de la asignación de una **semana** ≈ ~$2, aproximadamente 4× menos, lo que reduce el total de la ejecución de ~$10-11 a **~$3-4**. Las filas de Kimi/GLM ya eran semanales. *Reconciliado:* la auditoría independiente califica el total corregido de ~$3-4 como **respaldado** (la aritmética es sólida), con la salvedad de que solo DeepSeek es coste marginal real de pago por uso, Kimi, GLM y Claude son fracciones amortizadas de planes fijos, no cargos medidos por separado.

**Salvedades honestas, dichas con claridad:**

- **El % del plan no es dólares marginales.** Solo DeepSeek y la ventana de tokens de Claude se miden por uso; Kimi y GLM son fracciones de suscripciones fijas. Las cifras amortizadas ilustran "qué fracción de lo que ya pago", no un cargo facturado por separado.
- **El argumento es estructural, no "gratis".** ~2,2M de tokens de orquestación es un coste real. La afirmación es que *la orquestación es el nivel caro y la mano de obra tiene precio de consumo*, que es exactamente la palanca que hace económica a una flota.

La conclusión: una ejecución de ingeniería autónoma de cinco horas, totalmente verificada, por unos pocos dólares amortizados, y el componente más caro es el orquestador *reemplazable*, no la mano de obra.

---

## 10. Evidencia y limitaciones

### Lo que se ha construido y medido

- **Autonomía de horizonte largo, repetida, no algo puntual.** **Cuatro** ejecuciones autónomas completadas, todas fusionadas con **cero regresiones**, suite core 1908→2697 (**+789 pruebas** a lo largo de unas 31 h): Mega-Sprint #1 (~5 h, 9/9 sprints, **+294**, 0 intervenciones humanas hasta la compuerta de fusión), la vía de convergencia del Mega-Sprint #2 (6 sprints, **+115**, el sustrato de memoria LKS), la vía de uso de computadora por GUI (~13 h, 10 sprints, **+229**, una cabeza de anclaje visual local en una GPU de 16GB) y la vía de investigación (~9 h, 8 sprints, **+151**, implicación a nivel de afirmación). Cada sprint pasó su propia comprobación en vivo de extremo a extremo y una auditoría adversaria *llevada hasta la convergencia*, cada ejecución de prueba que tocaba el corpus se hizo contra un clon con el corpus en vivo verificado como intacto. La vía de investigación tomó una excepción acotada y registrada a la regla de mano de obra libre de frontera (un modelo de frontera como crítico de auditoría de reserva únicamente, sobre un inicio de sesión de suscripción, nunca la API medida; el nivel de redacción se mantuvo de consumo). El patrón se reproduce.
- **Razonamiento verificable.** Un harness `false_pass_rate` real y sin modelo; el crítico entre familias puntuó cero pases falsos sobre el (pequeño) conjunto plantado en la ejecución en vivo (§4), medido, no garantizado.
- **Revisión de grado de seguridad.** Un sandbox Docker aislado de red y con capacidades eliminadas que demostrablemente bloquea lecturas de secretos del host y la salida por red (mitigación), más una revisión adversaria dirigida que atrapó un RCE real de host antes de la fusión (detección) (§5).
- **Economía soberana.** ~$3-4 amortizados por una ejecución de ~5 horas; la mano de obra de construcción corrió libre de frontera sobre modelos de consumo, con el modelo de frontera usado solo para la orquestación (§9).

### Limitaciones y alcance honesto

- **Sin benchmark de frontera.** Este documento no mide los modelos de BoBClaw contra Fable 5 cara a cara. La afirmación defendible es *autonomía* y *verificabilidad* demostradas, no una paridad de modelo con benchmark (§1).
- **La soberanía es arquitectónica, aún no demostrada con aislamiento de red.** El código entregado no tiene dependencia dura de frontera y el nivel de mano de obra corrió libre de frontera, pero una ejecución *de extremo a extremo* totalmente autoalojada y libre de frontera (solo pesos abiertos, sin APIs de consumo en la nube, sin ápice Claude) aún no se ha realizado como demo destacada (§9.1).
- **Algunas vías están diseñadas por delante de la construcción.** La columna de verificación, el pipeline de construcción y la convergencia de memoria (LKS↔BoB) están construidos y en la línea principal; las vías de GUI e investigación son cimientos deterministas con costuras respaldadas por modelo que aún se están productizando, y la cabeza de anclaje en vivo de la vía de GUI está actualmente *bloqueada por un activo de modelo local* (Holo3-35B aún no en disco), una dependencia que el sistema sacó a la superficie en lugar de fingir. El documento distingue "construido y medido" de "diseñado" en todo momento.
- **La medición de presupuesto es aproximada** en la ejecución citada; el hilado real del `usage` del proveedor es un seguimiento posterior.
- **El coste de verificación es real.** Los críticos descorrelacionados y las comprobaciones de implicación añaden llamadas. La economía de la §9 es *neta* de esa sobrecarga, que es el punto, pero es sobrecarga, no magia.

### Reproducibilidad

El sustrato es inspeccionable. Cada afirmación de este documento se corresponde con un módulo, un recuento de pruebas o un registro de ejecución en el repositorio de BoBClaw, la columna de verificación (`core/verify/`, `core/ses/`), el sandbox de construcción (`core/build/`), el ledger (`core/ledger/`), y los documentos de retrospectiva y resultados bajo `tasks/`. La auditoría de ledger de afirmaciones que acompaña a este documento registra cada cifra portante contra su fuente.

---

## 11. Conclusión

La semana en que un modelo de frontera fue retirado por orden gubernamental es la semana en que el supuesto central de la industria, *alquila el mejor modelo y construye sobre él*, dejó de ser seguro. El acceso es condicional. La geografía es decisiva. La capacidad que no posees puede serte arrebatada entre un martes y un viernes.

BoBClaw es una apuesta a que lo duradero que hay que poseer no es un modelo sino un **harness**: un sustrato que hace confiables a los modelos de consumo mediante verificación descorrelacionada, productivos mediante orquestación, y tuyos mediante la soberanía de clase de capacidad. La agregación te da una llave del castillo de otro. BoBClaw es la capa de encima, la que sigue funcionando cuando la llave se revoca.

---

*Borrador v0.95, afirmaciones portantes reconciliadas contra la auditoría independiente de ledger de afirmaciones (`audits/claims-ledger-v1.md`). Documento complementario: la historia de construcción "How BoB Built BoB" (la ejecución de dogfooding, en forma narrativa).*
