const ShopeeAPI = require('./shopee_api');

async function test() {
  const api = new ShopeeAPI();
  
  try {
    await api.initialize();
    
    // Test getting a product
    console.log('Testing product data fetch...');
    const product = await api.getProductData('327985547', '9368269078');
    
    if (product && product.data) {
      console.log('Product information:');
      console.log('- Name:', product.data.name);
      console.log('- Price:', product.data.price / 100000);  // Shopee prices are often in smaller units
      console.log('- Rating:', product.data.item_rating?.rating_star || 'No rating');
    } else {
      console.log('Failed to fetch product data');
    }
    
    // Optional: Test search
    // const searchResults = await api.getProductsByKeyword('phone case');
    // console.log(`Found ${searchResults?.items?.length || 0} results`);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await api.close();
  }
}

test();
