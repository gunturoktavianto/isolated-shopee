/**
 * payload_generator.js
 * Generates and processes payloads for Shopee's bot detection system
 * 
 * This module provides functions to:
 * 1. Generate browser fingerprinting data
 * 2. Process and encrypt this data
 * 3. Send it to Shopee's security endpoint
 * 4. Retrieve a valid risk_token
 */

const crypto = require('crypto');
const fetch = require('node-fetch');

/**
 * Generates a comprehensive payload of browser fingerprinting data
 * This collects the data that Shopee uses to determine if a client is legitimate
 */
function generatePayload() {
  // Create a simulated browser environment when running in Node.js
  const isNode = typeof window === 'undefined';
  
  // Set up simulated browser environment values for Node.js
  const simulatedEnvironment = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    language: 'en-US',
    platform: 'Win32',
    screenWidth: 1920,
    screenHeight: 1080,
    colorDepth: 24,
    pixelRatio: 1,
    timeZone: 'Asia/Taipei',
    timeZoneOffset: -480,
    plugins: [
      { name: 'Chrome PDF Plugin', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', description: '' },
      { name: 'Native Client', description: '' }
    ],
    hasLocalStorage: true,
    hasSessionStorage: true,
    hasIndexedDB: true,
    canvasFingerprint: 'c0ffee12345abcdef',
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    cpuCores: 8,
    deviceMemory: 8,
    touchPoints: 0
  };

  // Basic browser info
  const browserData = {
    user_agent: isNode ? simulatedEnvironment.userAgent : navigator.userAgent,
    browser_language: isNode ? simulatedEnvironment.language : navigator.language,
    platform: isNode ? simulatedEnvironment.platform : navigator.platform,
    cookie_enabled: isNode ? true : navigator.cookieEnabled,
    
    // Screen and window properties
    screen_width: isNode ? simulatedEnvironment.screenWidth : window.screen.width,
    screen_height: isNode ? simulatedEnvironment.screenHeight : window.screen.height,
    color_depth: isNode ? simulatedEnvironment.colorDepth : window.screen.colorDepth,
    window_width: isNode ? simulatedEnvironment.screenWidth : (window.innerWidth || 0),
    window_height: isNode ? simulatedEnvironment.screenHeight : (window.innerHeight || 0),
    pixel_ratio: isNode ? simulatedEnvironment.pixelRatio : (window.devicePixelRatio || 1),
    
    // Time zone info
    timezone: isNode ? simulatedEnvironment.timeZone : Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezone_offset: isNode ? simulatedEnvironment.timeZoneOffset : new Date().getTimezoneOffset(),
    
    // Feature detection
    has_local_storage: isNode ? simulatedEnvironment.hasLocalStorage : typeof localStorage !== 'undefined',
    has_session_storage: isNode ? simulatedEnvironment.hasSessionStorage : typeof sessionStorage !== 'undefined',
    has_indexed_db: isNode ? simulatedEnvironment.hasIndexedDB : typeof indexedDB !== 'undefined',
    has_touch_support: isNode ? (simulatedEnvironment.touchPoints > 0) : ('ontouchstart' in window),
    
    // Canvas and WebGL fingerprinting
    canvas_fingerprint: isNode ? simulatedEnvironment.canvasFingerprint : getCanvasFingerprint(),
    webgl_vendor: isNode ? simulatedEnvironment.webglVendor : getWebGLVendor(),
    webgl_renderer: isNode ? simulatedEnvironment.webglRenderer : getWebGLRenderer(),
    
    // Hardware info
    cpu_cores: isNode ? simulatedEnvironment.cpuCores : (navigator.hardwareConcurrency || 0),
    device_memory: isNode ? simulatedEnvironment.deviceMemory : (navigator.deviceMemory || 0),
    
    // Additional info Shopee might use
    is_mobile: isMobileDevice(),
    plugins: isNode ? simulatedEnvironment.plugins : getBrowserPlugins(),
    timestamp: Date.now(),
    page_load_time: getPageLoadTime(),
    
    // Additional metadata
    version: '2.26.481',
    session_id: generateSessionId(),
    page_id: generateUUID()
  };

  return browserData;
}

/**
 * Canvas fingerprinting function
 */
function getCanvasFingerprint() {
  if (typeof document === 'undefined') return '';
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 240;
    canvas.height = 60;
    
    // Text with custom font
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    
    // Add colored text
    ctx.fillStyle = '#069';
    ctx.font = '15px Arial';
    ctx.fillText('Shopee Security', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Shopee Security', 4, 17);
    
    // Generate hash from canvas data URL
    const dataURL = canvas.toDataURL();
    return crypto.createHash('md5').update(dataURL).digest('hex');
  } catch (e) {
    return '';
  }
}

/**
 * Get WebGL vendor information
 */
function getWebGLVendor() {
  if (typeof document === 'undefined') return '';
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    return debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
  } catch (e) {
    return '';
  }
}

/**
 * Get WebGL renderer information
 */
function getWebGLRenderer() {
  if (typeof document === 'undefined') return '';
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  } catch (e) {
    return '';
  }
}

/**
 * Get browser plugins information
 */
function getBrowserPlugins() {
  if (typeof navigator === 'undefined' || !navigator.plugins) return [];
  
  try {
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      plugins.push({
        name: plugin.name,
        description: plugin.description
      });
    }
    return plugins;
  } catch (e) {
    return [];
  }
}

/**
 * Check if device is mobile
 */
function isMobileDevice() {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

/**
 * Get page load time
 */
function getPageLoadTime() {
  if (typeof window === 'undefined' || !window.performance) return 0;
  
  const timing = window.performance.timing;
  return timing.loadEventEnd - timing.navigationStart;
}

/**
 * Generate a session ID - mimics Shopee's session ID format
 */
function generateSessionId() {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate a UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Encrypt the payload according to Shopee's encryption method
 * Note: This is a simplified version; the actual encryption is more complex
 */
function encryptPayload(payload) {
  // Step 1: Convert to JSON string
  const jsonString = JSON.stringify(payload);
  
  // Step 2: Apply simple "compression" (just a placeholder)
  const compressed = jsonString;
  
  // Step 3: Generate a key based on timestamp and some payload values
  const timestamp = Date.now();
  const keyData = `${payload.user_agent}${timestamp}${payload.page_id}`;
  const key = crypto.createHash('sha256').update(keyData).digest();
  
  // Step 4: Use symmetric encryption (AES-256-CBC in a real implementation)
  // This is simplified for demonstration purposes
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key.slice(0, 32), iv);
    let encrypted = cipher.update(compressed, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Combine IV and encrypted data (in a real implementation, this would be more complex)
    const result = Buffer.concat([iv, Buffer.from(encrypted, 'base64')]);
    
    // Return Base64-encoded result
    return result.toString('base64');
  } catch (e) {
    // Fallback to simpler encoding if encryption fails
    console.warn('Encryption error, using fallback:', e.message);
    return Buffer.from(compressed).toString('base64');
  }
}

/**
 * Sends the payload to the Shopee endpoint and returns the risk_token
 */
async function getRiskToken() {
  const payload = generatePayload();
  
  try {
    // Encrypt the payload
    const encryptedPayload = encryptPayload(payload);
    
    // Send the request to the Shopee endpoint
    const response = await fetch('https://df.infra.shopee.tw/v2/shpsec/web/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        'User-Agent': payload.user_agent,
        'Origin': 'https://shopee.tw',
        'Referer': 'https://shopee.tw/',
        'szdet': Date.now().toString()  // Special Shopee header observed in requests
      },
      body: encryptedPayload
    });
    
    const result = await response.json();
    
    if (result.code === 0 && result.data && result.data.riskToken) {
      return result.data.riskToken;
    } else {
      throw new Error(`Failed to get risk token: ${result.msg || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error getting risk token:', error);
    throw error;
  }
}

module.exports = {
  generatePayload,
  encryptPayload,
  getRiskToken
};
