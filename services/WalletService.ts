import { BrowserProvider } from 'ethers';

/**
 * SOVEREIGN WALLET SERVICE v3.2
 * MetaMask Injected Handshake
 */

class WalletService {
  private provider: any = null;

  async connect() {
    if (window.ethereum) {
      this.provider = window.ethereum;
      const browserProvider = new BrowserProvider(this.provider);
      await browserProvider.send("eth_requestAccounts", []);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      
      return { 
        connector: { provider: this.provider }, 
        session: { namespaces: { eip155: { accounts: [`eip155:1:${address}`] } } } 
      };
    } else {
      throw new Error("MetaMask not found");
    }
  }

  async disconnect() {
    // MetaMask doesn't have a direct disconnect method in the same way
    this.provider = null;
  }

  getSession() {
    return this.provider;
  }
}

export const walletService = new WalletService();
