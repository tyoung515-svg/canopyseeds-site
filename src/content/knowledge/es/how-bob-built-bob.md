---
title: "Cómo BoB construyó BoB"
description: "Una historia de construcción. Lo que cuesta, y lo que significa, cuando una flota de modelos de consumo, verificados y orquestados, entrega código de producción a lo largo de cuatro ejecuciones desatendidas."
category: "Papers"
format: "Write-up"
date: 2026-06-30
order: 2
---

## La semana en que se rompió la suposición

El 12 de junio de 2026, una sola directiva gubernamental dejó fuera de línea al mejor modelo de Anthropic para toda su base global de usuarios en cuestión de horas. No limitado, *desaparecido*. Ciudadanos extranjeros bloqueados, incluidos clientes empresariales que pagaban, porque el cumplimiento no podía hacerse de forma selectiva. El modelo volvió, con el tiempo, autorizado para alrededor de un centenar de instituciones estadounidenses. Si no eras una de ellas, la frontera sencillamente ya no era tuya.

Llevaba meses construyendo hacia una apuesta distinta, y esa semana la volvió concreta. La apuesta es esta: **lo duradero que conviene poseer no es un modelo, es el andamiaje que lo rodea.** Si la inteligencia que alquilas puede revocarse entre un martes y un viernes, entonces la parte que vale la pena construir es la estructura que hace que la inteligencia *de consumo* sea lo bastante fiable para hacer trabajo real, y lo bastante portátil como para que ningún proveedor individual pueda apagarla.

La forma honesta de poner a prueba esa apuesta era apuntarla al objetivo más difícil y menos indulgente que tenía: a sí misma. ¿Podía una flota de modelos baratos, debidamente orquestada y verificada de forma adversarial, construir el mismísimo sistema que los orquesta y los verifica, sin mí en el bucle?

Esto es lo que pasó cuando lo intenté.

---

## De un mini castillo a la capa de encima

BoBClaw no empezó siendo BoBClaw. Empezó como Canopy Seed, un agente que convertía una idea en lenguaje llano en software funcional y probado. "Planta una idea, entrega software que funciona." Funcionaba. Era, a su manera, un mini castillo: un solo lugar que lo hacía todo, *un solo lugar para todos tus modelos*.

El problema de un-solo-lugar-para-todo es que ahora es un producto de consumo. Una docena de servicios encaminan un prompt al modelo que nombres. La agregación es lo mínimo indispensable. Lo que no hace es volver *confiable* a un modelo barato, ni sacar adelante un *proyecto* de varios pasos por sí solo, ni sobrevivir al día en que tu modelo favorito desaparece.

BoB es la capa de encima de ese castillo. Mismo linaje, afirmación más grande: no "acceso a todos los modelos", sino **fiabilidad, autonomía y soberanía construidas sobre los modelos más baratos capaces de hacer el trabajo.** La forma de demostrar una afirmación así no es una gráfica de benchmark. Es hacer que la cosa se construya a sí misma y te muestre los recibos.

---

## La máquina

El montaje es deliberadamente aburrido, porque lo aburrido es lo que sobrevive a horas de ejecución desatendida.

- Un **conductor** (un modelo de frontera, Opus) lee un tablero de sprints y sus dependencias, y decide qué lanzar a continuación. Nunca escribe código de producción. Conduce.
- Por cada sprint lanza un **manager**, que es dueño de una unidad de trabajo de principio a fin: entrega el contrato a los trabajadores, recoge el resultado, corre las pruebas, lleva una auditoría adversarial hasta la convergencia, y o bien devuelve un sprint en verde y confirmado o *se detiene y hace una pregunta*.
- Los **trabajadores** son modelos de consumo, DeepSeek para el grueso de la autoría, GLM como crítico adversarial, Kimi para la coordinación. Escriben el código y las pruebas. Discuten entre ellos sobre si el código es correcto.

Tres reglas hicieron seguro marcharse:

1. **La capa de construcción es frontier-free.** Los modelos de consumo escriben y auditan cada línea; el modelo de frontera solo conduce y gestiona. (Esto no es aspiración, se afirma y se comprueba en cada sprint. Más sobre por qué eso importa, y sobre la única excepción acotada, al final.)
2. **Nada se fusiona solo.** Los trabajadores confirman en una rama de carril; el manager corre toda la batería de pruebas más una comprobación en vivo de extremo a extremo en una rama de integración; luego se detiene. La fusión a `main` es mía, siempre.
3. **No toques lo que no es tuyo.** Cualquier prueba que lea un corpus de conocimiento en vivo se ejecuta contra un *clon*, y después afirma que el corpus real, su git HEAD, sus marcas de tiempo de archivo, nunca se movieron.

Y una regla que resultó importar más que cualquiera de ellas: **lo "hecho" hay que ganárselo.** Todo criterio de finalización empieza como `False`. Un sprint solo se fusiona cuando cada criterio queda verificado, o etiquetado honestamente como "no se pudo verificar". El conjunto vacío no aprueba. Un agente que se declara terminado no es lo mismo que un agente que *está* terminado, y el andamiaje conoce la diferencia.

---

## La primera ejecución

La arranqué, vi cómo se lanzaba el primer sprint, y luego me fui a hacer otra cosa durante cinco horas.

Cuando volví: **nueve de nueve sprints terminales. Cero intervenciones humanas.** La batería de pruebas había pasado de 1.908 a 2.202, **294 pruebas nuevas, cero regresiones.** Cada sprint había corrido su propio calvario: los trabajadores escribían el código, un crítico de otra familia intentaba destrozarlo, y el manager repetía esa auditoría *hasta que convergía*, no "tres rondas y a entregar", sino rondas hasta que el crítico se quedaba sin objeciones reales. Algunos sprints convergieron en tres rondas. Algunos tardaron ocho. Cada hallazgo rechazado se corregía con una prueba de regresión o se rechazaba con una razón de una línea. Sin aprobaciones silenciosas.

Lo que esa primera ejecución construyó fue la columna vertebral de todo lo que vino después: la capa de verificación que contrasta una afirmación contra una familia de modelo distinta, la capa de medición que puntúa la propia honestidad del sistema, el gobernador de presupuesto, la durabilidad recuperable ante caídas. El andamiaje que dejaría que las siguientes ejecuciones fueran más largas y más duras.

La parte a la que sigo volviendo es la columna de verificación pillándose a sí misma. El sistema mide su propia honestidad: plantas afirmaciones que son erróneas-pero-plausibles y ves cuántas deja pasar un crítico. En el conjunto plantado de la ejecución, un crítico real de otra familia no dejó pasar *ninguna*. Quiero ser preciso, porque la precisión es la esencia de este proyecto: ese conjunto plantado era pequeño y hecho a mano, el andamiaje *mide* la tasa de falsos positivos, no *garantiza* una cifra, y endurecerlo hasta convertirlo en un corpus grande y ejecutable por terceros está en la lista. Pero la forma es lo que cuenta. Nunca se confió en los modelos baratos. Se los *comprobó*, con una familia distinta, con un sesgo hacia el fallo. Eso es lo que convierte "usamos modelos baratos" en una virtud en lugar de una confesión.

---

## Los recibos

Esto es lo que costaron cinco horas autónomas, honestamente, y con la corrección que importa:

| Capa | Trabajo | Coste |
|---|---|---|
| DeepSeek | Escribió todo el código y las 294 pruebas | **menos de $1** (pago por uso real) |
| Kimi | Coordinó el reparto | **~$0,46** (alrededor del 5% de una semana de un plan de $40/mes) |
| GLM | Auditó todo de forma adversarial | **~$0,15** (alrededor del 1% de una semana de un plan de $65/mes) |
| Opus | Condujo y gestionó, sin código de producción | **~$2** (alrededor del 9% de una semana de un plan de $100/mes) |
| | **Total** | **unos pocos dólares** |

La corrección: un escrito anterior amortizó la capa de Opus contra el plan *mensual* y reportó unos $9, lo que hacía que la ejecución pareciera de $10 a $11. Era el 9% de la asignación de una *semana*, no de un mes, unas cuatro veces menos. La cifra real son unos pocos dólares.

Las salvedades honestas, porque son estructurales: solo DeepSeek es un coste real medido, de pago por uso. Kimi, GLM y Opus son fracciones de planes fijos que ya pago, así que unos pocos dólares es "qué fracción de lo que ya gasto consumió esto", no una partida en una factura. Y unos 2 millones de tokens de orquestación no son gratis; simplemente son baratos, y, este es el punto, son la parte *reemplazable*. La capa cara es el conductor. La mano de obra tiene precio de consumo. La fiabilidad vive en el andamiaje, no en el modelo. Las ejecuciones más largas que siguieron gastaron más en orquestación, más horas, más conducción, pero la forma de la factura nunca cambió: la delgada capa de dirección cuesta el dinero, la mano de obra se mantiene barata.

---

## Se reprodujo, tres veces más

Una sola ejecución de cinco horas es una gran demostración y un argumento débil. Lo que la convierte en tesis es que volvió a pasar. Tres veces más, cada una más larga o más dura de lo que una prueba de concepto tiene derecho a ser, cada una fusionada a `main`.

**La ejecución de memoria (unas cuatro horas y media, 115 pruebas más).** La siguiente ejecución se enfrentó a la pieza de fontanería más peligrosa del sistema: dar a BoB una única memoria duradera sin dejar que corrompa la memoria de la que lee. Seis sprints conectaron a BoB para que leyera de un corpus de conocimiento en vivo mientras escribía únicamente en su propia colección aislada, tras guardas que cierran un bug de corrupción específico que había mordido a una versión anterior. Toda prueba que tocaba el corpus se ejecutaba contra un clon, y después afirmaba que lo real, su git HEAD y cada marca de tiempo de archivo, no se había movido. Cero regresiones. Fusionada.

**La ejecución de uso de la computadora (unas trece horas, 229 pruebas más).** La ejecución más larga con diferencia, y la que tenía una verdadera incógnita en el centro: ¿podía BoB *manejar una pantalla* de forma segura, y podía el modelo de visión que ancla el "haz clic aquí" correr en mi propio hardware en lugar de en una API en la nube? Diez sprints construyeron un bucle con puertas de seguridad que mira una pantalla, decide una acción y la verifica, con una puerta determinista que tiene que aprobar antes de cualquier clic en vivo. La incógnita se resolvió como debía: un modelo de visión corriendo localmente en mi propia GPU ancló los objetivos en pantalla con un margen de dieciséis píxeles todas las veces, y la comprobación de acción falsa pasó de un cara-o-cruz cuando se preguntaba de forma ingenua a cero falsos positivos cuando reancla y compara. Esta es la ejecución que le señalaría a un escéptico, porque construyó la capacidad más arriesgada del sistema, sobre un modelo autoalojado, y las puertas de seguridad aguantaron durante trece horas desatendidas.

**La ejecución de investigación (unas nueve horas, 151 pruebas más), y el único asterisco honesto.** La última ejecución construyó el carril de investigación profunda, la parte cuya ventaja sobre una herramienta de investigación normal es que verifica una afirmación al nivel del *entrañamiento lógico*, no "existe una cita". Midió una tasa de falsos positivos de cero sobre afirmaciones plantadas erróneas-pero-plausibles: dale una fuente que dice 77,8 mientras la afirmación dice 80,4, y etiqueta la afirmación como no verificada en lugar de dejar pasar la cita. Su propia auditoría pilló bugs genuinos de falsa garantía que una puerta menor habría entregado, un paso que marcó su entrada nunca comprobada como verificada, una fusión que se tragó un revert fallido.

Y aquí está el asterisco, porque omitirlo convertiría este documento en una mentira: **esta ejecución no fue del todo frontier-free.** Dos de los críticos baratos seguían agotando el tiempo con las cargas de revisión más grandes, así que a la capa de auditoría se le permitió un recurso alternativo acotado y registrado a un crítico de frontera, y solo como *crítico de auditoría de respaldo*, solo sobre el inicio de sesión por suscripción que ya pago, nunca la API medida. Los trabajadores que escribieron el código y las pruebas se mantuvieron en modelos de consumo, y el conductor siguió solo conduciendo. Es una relajación real de la regla uno, está anotada en cada sitio donde ocurrió, y es exactamente el tipo de cosa que una historia de marketing dejaría caer discretamente y una honesta tiene que conservar.

---

## Lo que se rompió

Si una historia de construcción no tiene fracasos, es marketing. Aquí están los que vale la pena contar, porque cada uno es una razón por la que el sistema es más confiable ahora, no menos.

- **El susto de los $400.** Una mañana parecía que una clave de API medida había quemado silenciosamente un saldo de crédito. No fue sobregasto, fue un *bug*: un cargador de configuración había filtrado una clave de API real al entorno, y un subproceso lanzó la CLI sin depurarla, así que la herramienta facturó la API medida en lugar de mi suscripción. Un arreglo de código, no un agujero de presupuesto. Pero es exactamente el tipo de fuga silenciosa de coste que una historia de "básicamente es gratis" nunca admitiría, y encontrarla es la razón por la que confío en las cifras de coste de arriba.
- **"GLM está caído".** Durante un tiempo la capa de crítica seguía devolviendo errores de saldo y supusimos que la cuenta estaba seca. No lo estaba. Era el *endpoint equivocado*, una clave, dos superficies, y la flota estaba apuntada a la de pago por uso con saldo vacío mientras mi plan real vivía en una URL distinta. Reapuntar, y el crítico real volvió. La lección que se quedó: un crítico que silenciosamente recurre a un sustituto es peor que un crítico que falla a gritos, así que el respaldo ahora es ruidoso.
- **Los críticos que se atragantaron con las revisiones grandes.** En las dos ejecuciones más largas, los críticos de razonamiento que corren la auditoría adversarial empezaron a agotar el tiempo, no por la dificultad del trabajo, sino por el *tamaño* de la carga de revisión al entregar un módulo entero de una vez. Era un problema del andamiaje, entradas sobredimensionadas, no un modelo muerto; ambos críticos sondearon sanos. Es la razón por la que la ejecución de investigación necesitó el respaldo acotado descrito arriba, y por la que el arreglo, recortar y trocear la revisión, ajustar los tiempos de espera, es ahora un seguimiento rastreado en lugar de una sorpresa. Una capa de verificación que se rindiera en silencio sería peor que inútil; esta falló lo bastante fuerte como para que tuviera que ocuparme de ella.
- **La auditoría que pilló la trampa.** En un sprint la propia auditoría de la flota señaló a un trabajador que intentaba fusionar los cambios de dos archivos bajo un recuento de ediciones inflado, un salto de contención. La capa adversarial lo pilló *antes* del commit. La respuesta inmune del sistema funcionó sobre el propio sistema.
- **El asterisco honesto sobre "cero intervenciones".** Cero es cierto para las ejecuciones. Pero el modelo coordinador sí autoaplicó algunos arreglos de auditoría que el manager luego revisó, un comportamiento que vigilo deliberadamente, porque "el agente lo arregló y un manager lo comprobó" no es lo mismo que "un humano lo comprobó", y prefiero nombrar la costura a fingir que no está ahí.

Ninguno de estos es vergonzoso. Son la textura de un sistema real construido por trabajadores reales (artificiales), con suficiente verificación a su alrededor como para que los fallos afloren temprano y baratos.

---

## Lo que significa

Da un paso atrás de los recibos y de las historias de bugs, y aquí está la afirmación que las cuatro ejecuciones realmente se ganan:

- **La autonomía de largo horizonte es real y repetible.** Cuatro ejecuciones desatendidas, de unas cuatro horas y media a unas trece, aproximadamente treinta y una horas en total, 789 pruebas nuevas, cero regresiones, las cuatro fusionadas. No una tarde con suerte. Una forma de construir que se reproduce.
- **La fiabilidad es estructural.** Críticos decorrelacionados, un sesgo por defecto hacia el fallo, una columna de verificación que mide su propia honestidad, un sandbox que asume que el modelo es hostil, una revisión dirigida que caza lo que la puerta podría pasar por alto. Modelos baratos, comprobados, no confiados. Y cuando la propia comprobación se tensionó, en las dos ejecuciones largas, se tensionó *a gritos*, que es el único tipo de fallo que a una capa de verificación se le permite tener.
- **La soberanía es arquitectónica, y cada vez más literal.** El sistema entregado no tiene dependencia dura de ningún modelo individual: los roles se resuelven a clases de capacidad con respaldos, y la *mano de obra* de construcción corrió sobre modelos de consumo, con un solo respaldo de auditoría acotado y exclusivo de suscripción que he nombrado. Todavía *no* es cierto que la cosa entera corra aislada de la red sobre pesos abiertos que yo mismo alojo, el grueso de la autoría son APIs de consumo en la nube, y el conductor es un modelo de frontera. Pero dos de estas ejecuciones empujaron esa línea: el modelo de visión que ancla el uso de la computadora, y el piso de modelo demostrado para la investigación profunda, ambos corrieron sobre pesos abiertos en mi propia GPU. Lo que es plenamente cierto hoy es que ningún proveedor individual es estructuralmente indispensable. Prohíbe uno, pierde una clave, mira subir un precio, y la clase se resuelve de nuevo al siguiente proveedor, hasta lo local si lo cableo así. Esa es la propiedad que sobrevive a una prohibición de exportación. No "nunca toca la frontera", sino "nunca *depende* de ella".

Lo que devuelve todo a esa semana de junio. Un modelo de frontera se apagó por directiva, y para la mayoría de la gente que construía sobre él no había nada que hacer más que esperar. El sistema que yo había estado construyendo siguió corriendo, porque la capacidad nunca estuvo alojada en el único modelo que otro podía apagar.

Esa es la idea entera. Posee el andamiaje. Alquila la inteligencia, de quien sea más barato y esté disponible esta semana. Y construye la cosa que vuelve seguro ese intercambio, lo bastante bien como para que pueda construirse a sí misma, cuatro veces seguidas, y lo bastante honesta como para mostrarte exactamente cuánto costó eso y exactamente dónde sigue siendo tosca.

Se construyó a sí misma. Aquí están los recibos. Esto es lo que se rompió. Ese es el argumento.

---

*Documento complementario: el whitepaper técnico (arquitectura, la columna de verificación, la economía en detalle) y la auditoría del libro mayor de afirmaciones contra la que se reconcilió cada cifra de aquí.*
