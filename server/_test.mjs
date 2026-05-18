import { PrismaClient } from '@prisma/client';
import http from 'http';
import fs from 'fs';
import path from 'path';
const p = new PrismaClient();

function httpReq(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL('http://localhost:5000' + url);
    const data = body ? JSON.stringify(body) : '';
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method, headers: { ...(data ? { 'Content-Type':'application/json','Content-Length':Buffer.byteLength(data) } : {}), ...headers } }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); } catch(e) { reject(new Error(buf || res.statusCode + ' ' + res.statusMessage)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const post = (url, body) => httpReq('POST', url, body);
const get  = (url, token) => httpReq('GET',  url, null, token ? { Authorization: `Bearer ${token}` } : {});
const put  = (url, body, token) => httpReq('PUT', url, body, { Authorization: `Bearer ${token}` });

// multipart FormData upload
function uploadFile(url, filePath, token) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) return reject(new Error('File not found: ' + filePath));
    const filename = path.basename(filePath);
    const boundary = 'B' + Date.now().toString(36);
    const { data } = { data: fs.readFileSync(filePath) };
    const pre = `--${boundary}\r\nContent-Disposition: form-data; name="picture"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`;
    const post = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(pre), data, Buffer.from(post)]);
    const req = http.request({ hostname:'localhost', port:5000, path: url, method:'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'Authorization': `Bearer ${token}`
      }}, res => {
      let b = ''; res.on('data',c=>b+=c); res.on('end',()=>{try{resolve(JSON.parse(b))}catch(e){reject(new Error(b))}});
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function main() {
  const { token } = await post('/api/auth/login', { username: 'admin', password: 'admin123' });
  console.log('Got token:', !!token, '\n');

  const me  = await get('/api/auth/me', token);
  console.log('auth/me:', me.user ? { username: me.user.username, role: me.user.role, email: me.user.email, resident: me.user.resident ? 'present' : 'none' } : me.error);

  const upd = await put('/api/profile', { email: 'admin@test.com', fullName: 'System Administrator' }, token);
  console.log('\nPUT /api/profile:', upd.message || upd.error);
  if (upd.user) console.log('  email ->', upd.user.email);

  const tmp = path.join('C:\\Users\\ken\\Desktop\\webdev\\SRMS\\_tmp_up.png');
  if (!fs.existsSync(tmp)) fs.writeFileSync(tmp, Buffer.from('fake-png'));
  const pic = await uploadFile('/api/profile/picture', tmp, token);
  console.log('\nUpload picture:', pic.message || pic.error);
  if (pic.user?.profilePicture) console.log('  picture ->', pic.user.profilePicture);
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
}
main().catch(console.error).finally(() => p.$disconnect());
