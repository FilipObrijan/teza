// Utilitare pentru testele API: o bază de date curată, serverul compilat pornit ca proces separat
// și citirea emailurilor (în modul de dezvoltare serverul le scrie în consolă, nu le trimite).
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const ADMIN = { email: 'admin@test.local', password: 'adminpass123' };
export const PASSWORD = 'parola1234';

// O imagine PNG de 1×1 pixeli, suficientă pentru fotografia obligatorie a unui anunț.
export const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

export const getTestDatabaseUrl = () => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('Setează TEST_DATABASE_URL, ex. postgresql://agro_user:agro_password@localhost:5432/agro_test');
  }
  // Baza de date e ștearsă complet la fiecare rulare: refuzăm orice nume care nu arată a bază de test.
  if (!/test/i.test(new URL(url).pathname)) {
    throw new Error('Numele bazei din TEST_DATABASE_URL trebuie să conțină „test” (ea este ștearsă la fiecare rulare).');
  }
  return url;
};

export const resetDatabase = async (url) => {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await client.end();
};

export const startServer = async (databaseUrl, port = 4600) => {
  let output = '';
  const child = spawn(process.execPath, ['dist/index.js'], {
    cwd: serverDir,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: String(port),
      DATABASE_URL: databaseUrl,
      DATABASE_SSL: 'false',
      JWT_SECRET: 'test-secret',
      ADMIN_EMAIL: ADMIN.email,
      ADMIN_PASSWORD: ADMIN.password,
      CORS_ORIGIN: '',
      // Fără servicii externe: emailurile apar în consolă, iar verificarea AI e oprită.
      BREVO_API_KEY: '',
      SMTP_HOST: '',
      GEMINI_API_KEY: '',
      ANTHROPIC_API_KEY: '',
      GOOGLE_CLIENT_ID: '',
    },
  });
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Serverul nu a pornit în 30 s:\n${output}`)), 30000);
    const check = setInterval(() => {
      if (output.includes('Server is listening')) {
        clearInterval(check);
        clearTimeout(timer);
        resolve();
      }
    }, 100);
    child.on('exit', (code) => {
      clearInterval(check);
      clearTimeout(timer);
      reject(new Error(`Serverul s-a oprit (cod ${code}):\n${output}`));
    });
  });

  const baseUrl = `http://localhost:${port}/api`;

  const api = async (method, urlPath, { token, json, form } = {}) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (json) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${baseUrl}${urlPath}`, { method, headers, body: json ? JSON.stringify(json) : form });
    return { status: response.status, body: await response.json().catch(() => ({})) };
  };

  // Ultimul cod de 6 cifre trimis pe email unei adrese.
  const lastCode = (email) => {
    const matches = [...output.matchAll(/\[email\] ([^:\n]+): [^\n]*\n[^\n]*?(\d{6})/g)].filter((match) => match[1] === email);
    return matches.at(-1)?.[2];
  };

  const stop = () => new Promise((resolve) => {
    child.removeAllListeners('exit');
    child.once('exit', resolve);
    child.kill();
  });

  return { api, lastCode, stop, output: () => output };
};

export const login = async (api, email, password = PASSWORD) => {
  const response = await api('POST', '/auth/login', { json: { email, password } });
  return response.body.token;
};

// Înregistrează un cont, îl confirmă cu codul primit pe email și întoarce tokenul de sesiune.
export const registerVerified = async (server, { fullName, email, role, region = 'Criuleni' }) => {
  const registered = await server.api('POST', '/auth/register', { json: { fullName, email, password: PASSWORD, role, phone: '+37369000000', region } });
  if (registered.status !== 201) throw new Error(`Înregistrare eșuată: ${JSON.stringify(registered.body)}
${server.output().slice(-1500)}`);
  const verified = await server.api('POST', '/auth/verify-email', { json: { email, code: server.lastCode(email) } });
  if (verified.status !== 200) throw new Error(`Verificare eșuată: ${JSON.stringify(verified.body)}`);
  return login(server.api, email);
};

export const listingForm = (fields = {}) => {
  const form = new FormData();
  const values = { productName: 'Mere', variety: 'Golden', quantityKg: '1000', pricePerKg: '6', region: 'Criuleni', ...fields };
  for (const [key, value] of Object.entries(values)) form.append(key, value);
  form.append('image', new Blob([PNG], { type: 'image/png' }), 'mere.png');
  return form;
};
