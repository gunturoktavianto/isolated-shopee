const ShopeeRiskTokenGenerator = require('./shopee_token_generator');

async function testDirect() {
  const generator = new ShopeeRiskTokenGenerator();
  
  try {
    await generator.initialize();
    
    // First, get a risk token
    const token = await generator.getRiskToken();
    console.log('Successfully obtained risk token:', token);
    
    // Then use the generator's method to get product data
    console.log('Testing product data fetch directly from generator...');
    const productData = await generator.getProductData('327985547', '9368269078');
    
    if (productData && !productData.error) {
      console.log('Product information:');
      console.log('- Name:', productData.data?.name || 'Unknown');
      console.log('- Price:', productData.data?.price ? productData.data.price / 100000 : 'Unknown');
      console.log('- Rating:', productData.data?.item_rating?.rating_star || 'No rating');
    } else {
      console.log('Failed to fetch product data');
      if (productData && productData.error) {
        console.log('Error code:', productData.error);
        console.log('Error message:', productData.error_msg || 'No error message');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await generator.close();
  }
}

testDirect(); 