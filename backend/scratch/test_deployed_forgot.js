const https = require('https')

function post(path, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body)
    const req = https.request({
      hostname: 'pharmacy-import-website.onrender.com',
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => resolve({ status: res.statusCode, body: d }))
    })
    req.on('error', e => resolve({ status: 0, body: e.message }))
    req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0, body: 'TIMEOUT' }) })
    req.write(data)
    req.end()
  })
}

async function run() {
  console.log('Testing deployed forgot-password...')
  const r = await post('/api/auth/forgot-password', { email: 'mohammedshifa800@gmail.com' })
  console.log('Status:', r.status)
  console.log('Body:', r.body)
}

run()
