import axios from 'axios';

const testLogin = async () => {
  try {
    console.log('Testing login endpoint...\n');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@triveni.com',
      password: 'Admin@123'
    });
    
    console.log('✅ Login Successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Login Failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else if (error.request) {
      console.log('No response from server. Is the backend running on port 5000?');
    } else {
      console.log('Error:', error.message);
    }
  }
};

testLogin();
