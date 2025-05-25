const puppeteer = require('puppeteer');

/**
 * Risk Token Generator for Shopee
 * Uses Puppeteer to run a real browser instance, execute Shopee's own security code,
 * and capture the legitimately generated risk_token.
 */
class ShopeeRiskTokenGenerator {
  constructor() {
    this.riskToken = null;
    this.tokenExpiry = 0;
    this.tokenTTL = 30 * 60 * 1000; // 30 minutes (adjust based on testing)
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize the browser instance
   */
  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  /**
   * Close browser resources
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get a valid risk token
   * Returns cached token if still valid, or fetches a new one
   */
  async getRiskToken() {
    // Return cached token if still valid
    if (this.riskToken && Date.now() < this.tokenExpiry) {
      console.log('Using cached token');
      return this.riskToken;
    }

    try {
      await this.initialize();
      
      // Create a new page
      this.page = await this.browser.newPage();
      
      // Set a realistic user agent
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Enable request interception to capture the risk_token
      await this.page.setRequestInterception(true);
      
      let tokenPromise = new Promise((resolve) => {
        // Listen for responses from the security endpoint
        this.page.on('response', async response => {
          if (response.url().includes('/v2/shpsec/web/report')) {
            try {
              const data = await response.json();
              if (data.code === 0 && data.data && data.data.riskToken) {
                resolve(data.data.riskToken);
              }
            } catch (e) {
              // Non-JSON response or other error
            }
          }
        });
      });
      
      // Handle requests - we don't need to modify them, just continue
      this.page.on('request', request => request.continue());
      
      // Navigate to Shopee product page
      await this.page.goto('https://shopee.tw/product-i.327985547.9368269078', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Wait for the promise to resolve with the token
      this.riskToken = await Promise.race([
        tokenPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for risk token')), 15000))
      ]);
      
      // Set token expiry
      this.tokenExpiry = Date.now() + this.tokenTTL;
      
      console.log('Successfully obtained new risk token');
      
      // Clean up page
      await this.page.close();
      this.page = null;
      
      return this.riskToken;
    } catch (error) {
      console.error('Error getting risk token:', error);
      
      // Clean up on error
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      
      throw error;
    }
  }

  /**
   * Use the risk token to make a product API request
   */
  async getProductData(shopId, itemId) {
    try {
      const token = await this.getRiskToken();
      
      // Create a new page for the API request
      const page = await this.browser.newPage();
      
      // Set up request interception to modify headers
      await page.setRequestInterception(true);
      
      // Capture the response
      let responsePromise = new Promise(resolve => {
        page.on('response', async response => {
          if (response.url().includes('/api/v4/pdp/get_pc')) {
            try {
              const data = await response.json();
              resolve(data);
            } catch (e) {
              resolve(null);
            }
          }
        });
      });
      
      // Modify requests to include the risk token
      page.on('request', request => {
        if (request.url().includes('/api/v4/pdp/get_pc')) {
          const headers = request.headers();
          headers['risk-token'] = token;
          request.continue({ headers });
        } else {
          request.continue();
        }
      });
      
      // Make the request
      await page.goto(`https://shopee.tw/api/v4/pdp/get_pc?shop_id=${shopId}&item_id=${itemId}`, {
        waitUntil: 'networkidle0'
      });
      
      // Wait for the response data
      const productData = await responsePromise;
      
      // Clean up
      await page.close();
      
      return productData;
    } catch (error) {
      console.error('Error fetching product data:', error);
      throw error;
    }
  }
}

/**
 * Command line utility to fetch a risk token and test it
 */
async function main() {
  const generator = new ShopeeRiskTokenGenerator();
  
  try {
    // Get a risk token
    const token = await generator.getRiskToken();
    console.log('Risk Token:', token);
    
    // Test the token by fetching product data
    const productData = await generator.getProductData('327985547', '9368269078');
    
    if (productData && !productData.error) {
      console.log('Successfully fetched product data using risk token');
      console.log('Product name:', productData.data?.name || 'Unknown');
    } else {
      console.log('Token was rejected - could not fetch product data');
    }
  } catch (error) {
    console.error('Failed:', error);
  } finally {
    await generator.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = ShopeeRiskTokenGenerator;
