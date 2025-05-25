/**
 * Shopee API Client
 * 
 * This script demonstrates how to use the payload generator
 * to obtain a risk_token and make requests to Shopee's API.
 */

const fetch = require('node-fetch');
const { generatePayload, getRiskToken } = require('./payload_generator');
const ShopeeRiskTokenGenerator = require('./shopee_token_generator.js');

class ShopeeAPI {
  constructor() {
    this.baseUrl = 'https://shopee.tw';
    this.riskToken = null;
    this.tokenGenerator = new ShopeeRiskTokenGenerator();
  }

  /**
   * Initializes the client by obtaining a risk_token
   */
  async initialize() {
    try {
      await this.tokenGenerator.initialize();
      this.riskToken = await this.tokenGenerator.getRiskToken();
      console.log('Successfully obtained risk_token:', this.riskToken);
      return this.riskToken;
    } catch (error) {
      console.error('Failed to initialize client:', error);
      throw error;
    }
  }

  async close() {
    await this.tokenGenerator.close();
  }

  /**
   * Makes a request to Shopee's product data API
   * @param {string} productId - The product ID
   * @param {string} shopId - The shop ID
   * @returns {Promise<Object>} - The product data
   */
  async getProductData(shopId, productId) {
    if (!this.riskToken) {
      await this.initialize();
    }

    try {
      const url = `${this.baseUrl}/api/v4/pdp/get_pc?shop_id=${shopId}&item_id=${productId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'risk-token': this.riskToken
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get product data:', error);
      throw error;
    }
  }

  async getProductsByKeyword(keyword, limit = 10) {
    try {
      // Simplified implementation - in a real app, you would use the search API
      const page = await this.tokenGenerator.browser.newPage();
      
      // Set up request interception
      await page.setRequestInterception(true);
      
      // Add risk token to requests
      page.on('request', async request => {
        if (request.url().includes('/api/v4/search/search_items')) {
          const token = await this.tokenGenerator.getRiskToken();
          const headers = request.headers();
          headers['risk-token'] = token;
          request.continue({ headers });
        } else {
          request.continue();
        }
      });
      
      // Get search results
      let searchResults = null;
      page.on('response', async response => {
        if (response.url().includes('/api/v4/search/search_items')) {
          try {
            const data = await response.json();
            searchResults = data;
          } catch (e) {}
        }
      });
      
      await page.goto(`https://shopee.tw/api/v4/search/search_items?keyword=${encodeURIComponent(keyword)}&limit=${limit}`);
      
      await page.waitForTimeout(3000);
      await page.close();
      
      return searchResults;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Encrypts the payload according to Shopee's encryption method
   * This is a placeholder for the actual implementation
   */
  encryptPayload(payload) {
    // In a real implementation, we would apply Shopee's encryption algorithm
    // For now, we'll use a simple Base64 encoding as a placeholder
    const payloadString = JSON.stringify(payload);
    return Buffer.from(payloadString).toString('base64');
  }
}

/**
 * Example usage
 */
async function main() {
  const api = new ShopeeAPI();
  
  try {
    // Initialize the client and get a risk_token
    await api.initialize();
    
    // Use the client to get product data
    const productData = await api.getProductData('327985547', '9368269078');
    console.log('Product data:', productData);
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = ShopeeAPI; 