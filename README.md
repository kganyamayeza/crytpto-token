# my-erc20-token

Simple ERC20 token project with a tiny frontend that connects to MetaMask, shows balances and sends ETH/ERC20.


Made by kganya mayeza.

## Quick start
1. Install deps:
   ```
   npm install
   ```

2. Compile contracts:
   ```
   npm run compile
   ```

3. Deploy (example, add network name and env config):
   ```
   npx hardhat run scripts/deploy.js --network <network>
   ```

4. Run frontend locally:
   ```
   npm start
   ```
   Open http://127.0.0.1:5500/frontend

## Troubleshooting: "Injected wallet not found"

If the frontend says "No injected wallet found" but you have MetaMask installed:

- Do not open the HTML via file://. MetaMask injects only on http(s). Serve the frontend with a simple local server:
  - npm start (uses live-server as configured)
  - or use VS Code Live Server extension -> Open `frontend/index.html` with the extension
  - Then open: http://127.0.0.1:5500/frontend

- Make sure MetaMask is enabled for the site and you approve the connection prompt when clicking "Connect MetaMask".

- If you use multiple wallets or Brave, the code prefers the MetaMask provider. If issues persist, try disabling other wallet extensions and retry.

- If you still see no provider:
  - Confirm the browser extension is enabled.
  - Try restarting the browser.
  - Check the console (DevTools) for errors.

## Credits
made by kganya mayeza

## License
MIT
