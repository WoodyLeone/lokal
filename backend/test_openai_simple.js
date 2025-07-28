const axios = require('axios');

async function testOpenAI() {
  console.log('🧪 Testing OpenAI API...');
  
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 API Key available:', !!apiKey);
  
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Hello! Can you tell me what you can see in this image?'
        }
      ],
      max_tokens: 50
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ OpenAI API working!');
    console.log('Response:', response.data.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testOpenAI(); 