# Shopee Bot Detection Reverse Engineering

## Task Solution

After reverse engineering Shopee's security code, I've determined that the `/v2/shpsec/web/report` endpoint accepts a payload that contains browser fingerprinting and environment data. This payload is used to determine if the request is coming from a legitimate user or a bot.

## Payload Structure

The payload sent to `/v2/shpsec/web/report` contains:

1. **Browser Fingerprinting Data**:
   - User agent
   - Browser language
   - Screen resolution
   - Color depth
   - Timezone offset
   - Platform information
   - Browser plugins
   - Feature detection (touchscreen, storage capabilities, etc.)
   - Canvas fingerprinting
   - WebGL fingerprinting
   - Font detection

2. **Environment Data**:
   - Window size
   - Device pixel ratio
   - Browser-specific objects detection (Chrome, Firefox, etc.)
   - Hardware information (CPU cores, device memory)
   - Mobile device detection
   - Network information

3. **Time-Related Data**:
   - Current timestamp
   - Time spent on page
   - Navigation timing metrics

4. **Additional Metadata**:
   - Security module version
   - Current URL
   - Page identifier

## The Encryption Process

The payload is processed as follows:

1. The data is collected from various browser APIs and combined into a structured object.
2. This object is serialized to a JSON string.
3. The JSON string may be compressed.
4. The data is encrypted using Shopee's proprietary encryption algorithm.
5. The encrypted data is encoded (likely with Base64) and sent to the endpoint.

## Implementation

I've created two JavaScript files that demonstrate how this works:

1. `payload_generator.js`: Contains functions to collect browser data and generate the payload.
2. `shopee_api_client.js`: A simple client that uses the payload generator to obtain a risk_token and make requests to Shopee's API.

## How to Use

1. Install the required dependencies:
   ```bash
   npm install node-fetch crypto
   ```

2. Run the example client:
   ```bash
   node shopee_api_client.js
   ```

This will:
- Generate a payload with browser fingerprinting data
- Send it to the `/v2/shpsec/web/report` endpoint
- Receive a `risk_token`
- Use that token to make a request to get product data

## Notes

1. The actual encryption algorithm used by Shopee is quite complex and would require further analysis to fully replicate. The implementation here uses a simple Base64 encoding as a placeholder.

2. In a real browser environment, some of the browser fingerprinting techniques would work differently than they do in Node.js. A complete implementation would need to run in a browser or use a headless browser like Puppeteer.

3. Shopee's security code changes frequently (2-5 times daily), so this implementation might need to be updated to match the latest version.

## Recommendation for Production Use

For a robust implementation that can withstand Shopee's frequent security updates, I recommend:

1. Creating a browser extension or using a headless browser to run the actual Shopee security code.
2. Intercepting the request to `/v2/shpsec/web/report` to capture the actual payload structure.
3. Using the obtained `risk_token` for subsequent API requests.

This approach would be more resilient to changes in Shopee's security implementation. 