# Isolated Shopee.tw code

## Requirements

- Python 3.x
- Node ^18

## Running the Server

```bash
python -m http.server 8001
```

The code will run in http://localhost:8001/

## Your Task

To determine what data is encrypted and sent as the payload to `/v2/shpsec/web/report`

## Hints

The security code which prepares the payload is in https://deo.shopeemobile.com/shopee/modules-federation/live/0/shopee__web_enhance_sap/2.XX.YYY.js, when this isolated code was prepared the file refers to `2.26.481.js`

A simple deobfuscation result of the `2.26.481.js` file is available in the "deobfuscate" folder. You can run the script by:

```bash
cd deobfuscate
npm i
node deobfuscate.js
```

When doing a dynamic code analysis, you can override the file from deo.shopeemobile.com with the `2.26.481_deobfuscated.js` file. To learn how to override file in Chrome you can follow [this](https://www.youtube.com/watch?v=PT6xsr_AUQ0) tutorial.

Good luck!
