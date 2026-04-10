const bcrypt = require('bcrypt')
bcrypt.hash('Admin@1234', 12).then((hash) => {
  console.log('Hash:', hash)
  // Verify it works
  bcrypt.compare('Admin@1234', hash).then((ok) => {
    console.log('Verify:', ok)
  })
})
