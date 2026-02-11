import http from 'http';
import fs from 'fs';
import path from 'path';

// Minimal argv parsing
const argv = process.argv.slice(2);
const opts: Record<string, string | boolean> = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const key = a.substring(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      opts[key] = true;
    } else {
      opts[key] = next;
      i++;
    }
  }
}

const email = (opts.email as string) || process.env.TEST_USER_EMAIL || 'tanaka@example.com';
const password = (opts.password as string) || process.env.TEST_USER_PASSWORD || 'password123';
const save = !!opts.save;

function postJson(pathname: string, data: object): Promise<any> {
  const body = JSON.stringify(data);
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve(parsed);
        } catch (err) {
          reject(new Error('Failed to parse JSON response: ' + err));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}

(async () => {
  try {
    console.log(`Logging in as ${email}...`);
    const res = await postJson('/api/auth/login', { email, password });
    if (!res || !res.data || !res.data.token) {
      console.error('Login failed or token not found in response:', JSON.stringify(res, null, 2));
      process.exit(1);
    }

    const token: string = res.data.token;
    console.log('\n=== TOKEN ===');
    console.log(token);
    console.log('=== END TOKEN ===\n');

    console.log('curl example:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3001/api/auth/me`);

    if (save) {
      const envPath = path.join(__dirname, '..', '.env');
      let envText = '';
      try {
        envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      } catch (err) {
        console.error('Failed to read .env:', err);
      }

      const key = 'TEST_TOKEN';
      const newLine = `${key}=${token}`;
      if (envText.includes(key + '=')) {
        envText = envText.replace(new RegExp(`${key}=.*`), newLine);
      } else {
        if (envText.length && !envText.endsWith('\n')) envText += '\n';
        envText += newLine + '\n';
      }

      fs.writeFileSync(envPath, envText, 'utf8');
      console.log(`Saved token to ${envPath} as ${key}`);
    }
  } catch (err: any) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
