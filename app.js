const providerMeta = { provider: null, signer: null, address: null };
const ERC20_ABI = [
  // minimal ABI: balanceOf, decimals, symbol, name, transfer
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

const els = {
  btnConnect: document.getElementById('btnConnect'),
  addr: document.getElementById('addr'),
  network: document.getElementById('network'),
  ethBalance: document.getElementById('ethBalance'),
  accountInfo: document.getElementById('accountInfo'),
  tokenType: document.getElementById('tokenType'),
  erc20Fields: document.getElementById('erc20Fields'),
  tokenAddress: document.getElementById('tokenAddress'),
  tkName: document.getElementById('tkName'),
  tkSymbol: document.getElementById('tkSymbol'),
  tkBalance: document.getElementById('tkBalance'),
  to: document.getElementById('to'),
  amount: document.getElementById('amount'),
  btnSend: document.getElementById('btnSend'),
  status: document.getElementById('status'),
  examples: document.querySelectorAll('.examples .small')
};

async function detectProvider(){
  if (window.ethereum) {
    providerMeta.provider = new ethers.providers.Web3Provider(window.ethereum);
    return true;
  }
  els.status.textContent = "No injected wallet found. Install MetaMask.";
  return false;
}

async function findInjectedMetaMask() {
    // Handle multiple injected providers (Brave, other wallets) and prefer MetaMask
    if (!window.ethereum) return null;
    if (window.ethereum.providers && window.ethereum.providers.length) {
        return window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
    }
    return window.ethereum;
}

async function hasMetaMask() {
    return !!(await findInjectedMetaMask());
}

async function connectWallet(){
  const injected = await findInjectedMetaMask();
  if (!injected) {
    els.status.textContent = 'No injected wallet found. Install MetaMask or run the app via a local server (see README).';
    return;
  }

  try {
    // Use the specific provider instance (handles multiple providers)
    providerMeta.provider = new ethers.providers.Web3Provider(injected, "any");
    // Request accounts
    await providerMeta.provider.send("eth_requestAccounts", []);
    providerMeta.signer = providerMeta.provider.getSigner();
    providerMeta.address = await providerMeta.signer.getAddress();

    els.addr.textContent = providerMeta.address;
    els.accountInfo.classList.remove('hidden');
    const net = await providerMeta.provider.getNetwork();
    els.network.textContent = `${net.name} (${net.chainId})`;
    updateEthBalance();
    els.status.textContent = 'Wallet connected (MetaMask)';
    
    // Listen for account / chain changes and update UI
    if (injected.on) {
      injected.on('accountsChanged', (accounts) => {
        if (!accounts || accounts.length === 0) {
          // disconnected
          els.status.textContent = 'Wallet disconnected';
          providerMeta.address = null;
          els.accountInfo.classList.add('hidden');
        } else {
          providerMeta.address = accounts[0];
          els.addr.textContent = providerMeta.address;
          updateEthBalance();
          els.status.textContent = 'Account changed';
        }
      });
      injected.on('chainChanged', (chainId) => {
        // Reloading is simplest for chain change handling
        window.location.reload();
      });
    }
  } catch (e) {
    console.error(e);
    els.status.textContent = 'Connection rejected or failed';
  }
}

async function updateEthBalance(){
  try {
    const bal = await providerMeta.provider.getBalance(providerMeta.address);
    els.ethBalance.textContent = ethers.utils.formatEther(bal) + " ETH";
  } catch (e) { els.ethBalance.textContent = "—"; }
}

function showStatus(txt, err=false){
  els.status.textContent = txt || '';
  els.status.style.color = err ? '#ff8080' : '';
}

els.btnConnect.addEventListener('click', connectWallet);

els.tokenType.addEventListener('change', () => {
  const t = els.tokenType.value;
  if (t === 'ERC20') els.erc20Fields.classList.remove('hidden');
  else els.erc20Fields.classList.add('hidden');
});

// quick fill sample token address buttons
els.examples.forEach(btn => {
  btn.addEventListener('click', (e) => {
    els.tokenAddress.value = e.target.dataset.address;
    loadTokenMeta();
  });
});

async function loadTokenMeta(){
  const addr = els.tokenAddress.value.trim();
  if (!ethers.utils.isAddress(addr)) {
    els.tkName.textContent = 'invalid address';
    els.tkSymbol.textContent = '—';
    els.tkBalance.textContent = '—';
    return;
  }
  try {
    const contract = new ethers.Contract(addr, ERC20_ABI, providerMeta.provider);
    const [name, symbol, decimals] = await Promise.all([
      contract.name(), contract.symbol(), contract.decimals()
    ]);
    els.tkName.textContent = name;
    els.tkSymbol.textContent = symbol;
    // fetch balance (if connected)
    if (providerMeta.address) {
      const balRaw = await contract.balanceOf(providerMeta.address);
      els.tkBalance.textContent = ethers.utils.formatUnits(balRaw, decimals) + " " + symbol;
    } else {
      els.tkBalance.textContent = 'connect wallet';
    }
  } catch (e) {
    console.warn(e);
    els.tkName.textContent = 'error reading token';
    els.tkSymbol.textContent = '—';
    els.tkBalance.textContent = '—';
  }
}

// attempt to send ETH or ERC20
els.btnSend.addEventListener('click', async () => {
  showStatus('');
  if (!providerMeta.signer) { showStatus('Please connect wallet first', true); return; }
  const to = els.to.value.trim();
  if (!ethers.utils.isAddress(to)) { showStatus('Invalid recipient address', true); return; }
  const amt = els.amount.value.trim();
  if (!amt || isNaN(Number(amt))) { showStatus('Invalid amount', true); return; }

  try {
    if (els.tokenType.value === 'ETH'){
      showStatus('Sending ETH — creating tx ...');
      const tx = await providerMeta.signer.sendTransaction({
        to,
        value: ethers.utils.parseEther(amt)
      });
      showStatus(`TX sent: ${tx.hash}. waiting...`);
      await tx.wait();
      showStatus('ETH transfer confirmed');
      updateEthBalance();
    } else {
      const tokenAddr = els.tokenAddress.value.trim();
      if (!ethers.utils.isAddress(tokenAddr)) { showStatus('Invalid token address', true); return; }
      const contract = new ethers.Contract(tokenAddr, ERC20_ABI, providerMeta.signer);
      // get decimals to convert
      const decimals = await contract.decimals();
      const amountParsed = ethers.utils.parseUnits(amt, decimals);
      showStatus('Sending token tx ...');
      const tx = await contract.transfer(to, amountParsed);
      showStatus(`TX sent: ${tx.hash} — waiting...`);
      await tx.wait();
      showStatus('Token transfer confirmed');
      // refresh token meta (balance)
      loadTokenMeta();
    }
  } catch (err) {
    console.error(err);
    showStatus('Transaction failed or rejected', true);
  }
});

// update balances periodically if connected
setInterval(() => {
  if (providerMeta.address && providerMeta.provider) updateEthBalance();
}, 15000);

// try to auto-load token meta if field has value (for dev)
document.addEventListener('DOMContentLoaded', () => {
  if (els.tokenAddress.value) loadTokenMeta();
});