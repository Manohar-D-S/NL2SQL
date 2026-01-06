/**
 * Test Cerebras API Connection
 * Run: node test-cerebras.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Cerebras = require('@cerebras/cerebras_cloud_sdk').default;

async function testCerebrasConnection() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 Testing Cerebras API Connection');
    console.log('='.repeat(60));

    // Check if API key is set
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
        console.log('\n❌ CEREBRAS_API_KEY not found in environment!');
        console.log('\nTo fix this:');
        console.log('1. Create a .env file in this directory');
        console.log('2. Add: CEREBRAS_API_KEY=your-api-key-here');
        console.log('3. Get your API key from https://cloud.cerebras.ai');
        process.exit(1);
    }

    console.log('\n✅ API Key found:', apiKey.substring(0, 8) + '...' + apiKey.slice(-4));

    // Initialize client
    console.log('\n📡 Initializing Cerebras client...');
    const client = new Cerebras({ apiKey });

    // Test with a simple query
    console.log('\n🧠 Testing Qwen 3 235B model...');
    console.log('   Model: qwen-3-235b-a22b-instruct-2507');

    try {
        const startTime = Date.now();

        const completion = await client.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a SQL expert. Only respond with valid SQL queries, no explanations.'
                },
                {
                    role: 'user',
                    content: 'Convert to SQL: Show all databases'
                },
            ],
            model: 'qwen-3-235b-a22b-instruct-2507',
            temperature: 0.1,
            max_completion_tokens: 256,
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log('\n✅ SUCCESS! API is working!');
        console.log('='.repeat(60));
        console.log('\n📊 Response Details:');
        console.log(`   Response Time: ${responseTime}ms`);
        console.log(`   Model: ${completion.model}`);
        console.log(`   Tokens Used: ${completion.usage?.total_tokens || 'N/A'}`);
        console.log('\n📝 Generated SQL:');
        console.log('   ' + completion.choices[0]?.message?.content?.trim());
        console.log('\n' + '='.repeat(60));
        console.log('🎉 Cerebras API is ready to use!');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.log('\n❌ API Error:', error.message);

        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            console.log('\n🔑 Invalid API key. Please check your CEREBRAS_API_KEY.');
        } else if (error.message.includes('429')) {
            console.log('\n⏳ Rate limited. Please wait and try again.');
        } else if (error.message.includes('model')) {
            console.log('\n🤖 Model not available. Try a different model like "llama-3.3-70b".');
        }

        console.log('\nFull error:');
        console.log(error);
        process.exit(1);
    }
}

testCerebrasConnection();
