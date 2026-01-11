const API_BASE_URL = 'http://localhost/DigitalKitab/api';

async function apiCall(endpoint, method = 'GET', data = null) {
    console.log('🌐 API Call:', {
        url: API_BASE_URL + endpoint,
        method: method,
        data: data
    });

    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    };

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
        console.log('📦 Request body:', options.body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        console.log('📡 Response status:', response.status);

        const contentType = response.headers.get('content-type');
        console.log('📄 Content-Type:', contentType);

        const text = await response.text();
        console.log('📥 Raw response:', text);

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('❌ JSON Parse Error:', e);
            console.error('Response was:', text);
            throw new Error('Server returned invalid JSON. Check console for details.');
        }

        if (!response.ok) {
            throw new Error(result.message || 'API request failed');
        }

        return result;
    } catch (error) {
        console.error('❌ API Error:', error);
        throw error;
    }
}