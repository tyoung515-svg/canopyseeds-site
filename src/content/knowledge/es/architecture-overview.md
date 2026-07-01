---
title: "Cómo está construido BoB"
description: "Un recorrido sencillo por la arquitectura: el harness, la flota, la columna de verificación y el sustrato que hay debajo."
category: "Architecture"
format: "Write-up"
date: 2026-06-30
order: 1
---

La mayoría de las herramientas de IA tratan el modelo como el producto y el código que lo rodea como el pegamento. BoB invierte esa relación. El modelo es una pieza intercambiable, como una CPU. Lo que hace que BoB sea fiable, productivo y tuyo es el **harness** que envuelve al modelo. Este es un recorrido rápido por ese harness.

## Cuatro servicios

BoB son cuatro piezas que cooperan entre sí:

- **core** es quien lleva la batuta: enruta el trabajo, lo reparte entre una flota de modelos, verifica los resultados y mantiene un registro duradero de todo.
- **gateway** es la puerta: una capa web y de API con inicio de sesión, conversaciones, proyectos y aprobaciones.
- **pipeline** es una envoltura ligera para el nivel de planificación.
- **app** es el cliente de escritorio, el que usas a diario, con chat, una vista de enrutamiento y un constructor de equipos.

Todo lo sustancial ocurre dentro de core, como un grafo compilado por el que fluye una solicitud.

## La flota

BoB no se apoya en un único modelo. El trabajo se expresa como **roles**, no como proveedores:

- un **apex** que planifica y descompone una tarea,
- **workers** que hacen la labor,
- **critics** que revisan el trabajo de forma adversarial.

Cada rol se resuelve en un modelo concreto a través de una capa de enrutamiento, de modo que la misma tarea puede ejecutarse como un único worker barato, un fan-out de decenas o un consejo deliberante, según la configuración y no el código. La regla deliberada es la **decorrelación entre familias**: un critic siempre proviene de una familia de modelos distinta a la del worker que audita, para que ningún modelo dé el visto bueno a su propio tipo de error.

## La columna de verificación

Esta es la parte que convierte modelos baratos en modelos de confianza. Antes de dar por válido un resultado, BoB lo comprueba:

- una **comprobación de poscondición** le pregunta a un critic decorrelacionado si el resultado que se afirma realmente se cumple,
- una **compuerta de implicación de afirmaciones** vuelve a abrir la fuente citada para cualquier afirmación cuantitativa y pregunta: ¿esta fuente respalda de verdad este número?,
- la **terminación por fallo por defecto** significa que todo criterio de finalización empieza como no verificado, y el trabajo solo se entrega cuando cada uno queda verificado o marcado honestamente como desconocido.

Que algo esté «hecho» es algo que BoB se gana, no algo que da por supuesto.

## Tres carriles

La misma columna impulsa tres tipos de trabajo:

- el **carril de construcción** escribe código contra contratos y lo ejecuta dentro de un sandbox aislado antes de confiar en él,
- el **carril de investigación** responde preguntas con fuentes que efectivamente vuelve a leer,
- el **carril de uso de la computadora** maneja software real, comprobando que la pantalla cambió de la manera que se pretendía.

## Memoria y el sustrato

BoB se apoya en una base de conocimiento local viva. El conocimiento se compila una vez y se mantiene al día, de modo que BoB se vuelve más agudo sobre tu trabajo con el tiempo en lugar de empezar de cero en cada sesión. Por debajo, un ledger de solo anexado es el sistema de registro: BoB reconstruye el contexto recortando ese ledger, y no confiando en lo que quede por casualidad en la ventana de contexto de un modelo.

## Soberanía, por diseño

Como en la lógica no se nombra ningún modelo, solo clases de capacidad con cadenas de reserva, ningún proveedor por sí solo es imprescindible. Prohíbe un modelo, pierde una clave o mira cómo se dispara un precio, y la clase se vuelve a resolver hacia el siguiente proveedor, hasta llegar a la inferencia local si así lo quieres. Esa es la propiedad que sobrevive a una prohibición de exportación. El harness es tuyo. La inteligencia la alquilas, a quien resulte más barato y esté disponible esta semana.

Para el tratamiento completo, lee el [whitepaper técnico](/knowledge/bobclaw-whitepaper/).
