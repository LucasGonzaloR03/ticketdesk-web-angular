import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// En Vercel, API_URL apunta al Web Service de Render.
// En local, el valor por defecto mantiene el entorno de desarrollo actual.
const apiUrl = (process.env.API_URL ?? 'http://localhost:8080').replace(/\/+$/, '');

const scriptDir = dirname(fileURLToPath(import.meta.url));
const environmentFile = resolve(scriptDir, '../src/environments/environment.ts');

writeFileSync(
  environmentFile,
  `export const environment = {\n  apiUrl: ${JSON.stringify(apiUrl)},\n};\n`,
  'utf8',
);

console.log(`environment.ts generado con apiUrl=${apiUrl}`);
