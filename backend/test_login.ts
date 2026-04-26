import axios from 'axios'

async function test() {
  try {
    const res = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'student1@test.com',
      password: 'Student123!'
    })
    console.log('Login success:', res.data)
  } catch (err: any) {
    console.error('Login failed:', err.response?.data || err.message)
  }
}

test()
