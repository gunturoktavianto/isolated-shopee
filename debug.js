const ShopeeAPI = require('./shopee_api');
const fetch = require('node-fetch');

async function debug() {
  const api = new ShopeeAPI();
  
  try {
    await api.initialize();
    const riskToken = api.riskToken;
    
    // Create a manual fetch with debug information
    console.log('Using risk token:', riskToken);
    console.log('Making direct request to Shopee API...');
    
    const shopId = '327985547';
    const itemId = '9368269078';
    const url = `https://shopee.tw/api/v4/pdp/get_pc?shop_id=${shopId}&item_id=${itemId}`;
    
    console.log('Request URL:', url);
    
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'risk-token': riskToken,
      // Add standard browser headers
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://shopee.tw/product-i.327985547.9368269078',
      'Origin': 'https://shopee.tw',
      'Cookie': ''  // We might need cookies
    };
    
    console.log('Request Headers:', JSON.stringify(headers, null, 2));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));
    
    const responseBody = await response.text();
    console.log('Response Body (first 500 chars):', responseBody.substring(0, 500) + '...');
    
    try {
      const jsonResponse = JSON.parse(responseBody);
      if (jsonResponse.error) {
        console.log('API Error:', jsonResponse.error);
        console.log('Error Message:', jsonResponse.error_msg || 'No error message');
      }
    } catch (e) {
      console.log('Failed to parse response as JSON');
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await api.close();
  }
}

debug(); 