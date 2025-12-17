# @octavio.cubillos/simple-logger-express

![Versión](https://img.shields.io/badge/version-1.0.11-blue.svg)
![Licencia](https://img.shields.io/npm/l/@octavio.cubillos/simple-logger-express)

Un logger simple y configurable para Express.js que añade automáticamente un ID de solicitud a cada log usando `AsyncLocalStorage`, con formato de salida condicional y metadatos personalizables.

## 🤔 Conceptos Clave

Esta librería se basa en dos conceptos modernos de Node.js para ofrecer un logging potente y contextual.

#### Trazabilidad con `requestId`

Cuando tu servidor maneja múltiples solicitudes a la vez, los logs de diferentes usuarios se mezclan, haciendo muy difícil seguir una operación de principio a fin. Esta librería soluciona eso asignando un `requestId` único a cada solicitud entrante. Este ID actúa como un "hilo conductor" que te permite filtrar los logs y ver la historia completa de una sola petición.

#### `AsyncLocalStorage`: El Contexto Invisible

Para que el `requestId` esté disponible en todos tus archivos (controladores, servicios, etc.) sin tener que pasarlo como parámetro en cada función, usamos `AsyncLocalStorage`. Piensa en ello como una **"mochila invisible"** que se le asigna a cada solicitud. El middleware `initLogger` pone el `requestId` en esa mochila. Luego, sin importar en qué parte de tu código te encuentres, el logger puede "abrir" la mochila de la solicitud actual y recuperar el contexto.

## ✨ Características

-   **ID de Solicitud Automático**: Para una trazabilidad completa a través de `AsyncLocalStorage`.
-   **Formato Configurable**: Elige entre `texto` con colores (ideal para desarrollo) o `json` estructurado (perfecto para producción).
-   **Constructor Flexible**: La clase `Logger` acepta objetos, strings o números para añadir metadatos estáticos a tus logs.
-   **Uso Dual**: Provee un logger global para mensajes simples y un logger instanciable para un contexto más rico.

## 📥 Instalación

```bash
npm install @octavio.cubillos/simple-logger-express express uuid
npm install -D @types/express @types/uuid
```

## 🚀 Guía de Uso Detallada

### Paso 1: Inicializar el Middleware

Este es el paso fundamental para activar el contexto. En tu archivo principal (`app.ts` o `server.ts`), importa y usa `initLogger` **antes** de tus rutas.

```typescript
// src/app.ts
import express from 'express';
import { initLogger } from '@octavio.cubillos/simple-logger-express';

const app = express();

// Opción 1 (Recomendada para Desarrollo): Formato de texto con colores.
app.use(initLogger({ output: 'text' }));

// Opción 2 (Recomendada para Producción): Formato JSON estructurado.
// app.use(initLogger({ output: 'json' }));

// ... resto de tu configuración y rutas
```

### Paso 2: Estrategias de Logging

La librería ofrece dos formas de registrar logs, diseñadas para diferentes casos de uso.

#### A) `new Logger()` - El Logger de Instancia (Máxima Flexibilidad)

Esta es la forma recomendada para la lógica de tu aplicación (controladores, servicios, etc.). Creas una instancia de `Logger` y le pasas metadatos que se añadirán a todos los mensajes de esa instancia.

##### Con un Objeto (Método más claro)
```typescript
// src/controllers/user.controller.ts
import { Logger } from '@octavio.cubillos/simple-logger-express';

const log = new Logger({ 
  service: 'UserController', 
  file: __filename 
});

log.info('Buscando usuario...');
```

##### Con un String o Número (Atajo)
Si pasas un primitivo, se guardará bajo la clave `str`.
```typescript
// src/services/payment.service.ts
import { Logger } from '@octavio.cubillos/simple-logger-express';

const log = new Logger('PaymentService');

log.debug('Procesando pago...');
```

#### B) `logger` - El Logger Global

Perfecto para mensajes generales que no están atados a un contexto específico.

```typescript
// src/server.ts
import { logger } from '@octavio.cubillos/simple-logger-express';

logger.info(`🚀 Servidor escuchando en el puerto 3000`);
```

## 📋 Formato de Salida

#### Modo Desarrollo (`output: 'text'`)
`2025-08-08 14:15:30.123 [a1b2c3d4...] <service=UserController | file=user.controller.ts> [INFO]: Buscando usuario... `

#### Modo Producción (`output: 'json'`)
```json
{
  "timestamp": "2025-08-08T18:15:30.123Z",
  "requestId": "a1b2c3d4-e5f6-4a3b-8c7d-1234567890ab",
  "meta": {
    "service": "UserController",
    "file": "/path/to/project/src/controllers/user.controller.ts"
  },
  "level": "info",
  "message": "Buscando usuario..."
}
```

## 📜 Licencia

MIT
