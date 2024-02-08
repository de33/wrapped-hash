import { useState } from 'react';
import { eip1271Account, } from './src/eip1271-account';
import { createWalletClient, type Chain, custom, type Transport, WalletClient, Account, Address, toHex } from "viem";
import { localhost } from "viem/chains";
import './App.css';

type WalletClientWithAccount = WalletClient<Transport, Chain | undefined, Account>;


const getInjectedAccountSigner = async (): Promise<Account | undefined> => {
  try {
    // @ts-ignore
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts.length > 0 ? accounts[0] : undefined;
  } catch (error) {
    console.error('Error getting injected account signer:', error);
    return undefined;
  }
};

const provider = {
  on: (message: string, listener: (...args: any[]) => void) => {
    // @ts-ignore
    window.ethereum.on(message, listener);
  },
  removeListener: (message: string, listener: (...args: any[]) => void) => {
    // @ts-ignore
    window.ethereum.removeListener(message, listener);
  },
  request: async ({ method, params }: { method: string; params: any[] }) => {
    // @ts-ignore
    return window.ethereum.request({ method, params });
  },
};



const getWalletClientWithInjectedAccount = async (): Promise<WalletClientWithAccount> => {
  const accountAddress = await getInjectedAccountSigner();
  if (!accountAddress) throw new Error('No injected account found');
  return createWalletClient({
    account: accountAddress,
    chain: localhost,
    transport: custom(provider)
  });
};

function App() {
  const [accountAddress, setAccountAddress] = useState<Address | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSignatureValid, setIsSignatureValid] = useState<boolean | null>(null);


  const handleSignMessage = async () => {
    if (!accountAddress) throw new Error('Account address is not set');

    try {
      const walletClientWithAccount = await getWalletClientWithInjectedAccount();
      const account = await getInjectedAccountSigner();
      if (!account) throw new Error('No account address found');
      // const accountAddress = "0x83A086A272f59EeeA7D3c4E52D012E57E97cc658"
      const messageToSign = "Hello, world";
      const eipAccount = eip1271Account(accountAddress as Address, walletClientWithAccount);
      // @ts-ignore
      const signedMessage = await eipAccount.signMessage({ message: messageToSign });
      setSignature(signedMessage);

      const valid = await eipAccount.isValidSignature(toHex(messageToSign), signedMessage);
      setIsSignatureValid(valid);
    } catch (error) {
      console.error('Error signing message:', error);
    }
  };

  const requestAccountAccess = async () => {
    try {
      // @ts-ignore
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      });
      const account = await getInjectedAccountSigner();
      if (!account) throw new Error('No account found');
      return account;
    } catch (error) {
      console.error('Error requesting account access:', error);
      return undefined;
    }
  };

  const handleTypedData = async () => {
    if (!accountAddress) throw new Error('Account address is not set');

    try {
      const walletClientWithAccount = await getWalletClientWithInjectedAccount();
      const account = await getInjectedAccountSigner();
      if (!account) throw new Error('No account address found');
      // const accountAddress = "0x83A086A272f59EeeA7D3c4E52D012E57E97cc658"
      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' }
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' }
          ],
        },
        primaryType: 'Mail' as const,
        domain: {
          name: 'Ether Mail',
          version: '1',
          chainId: 1,
          verifyingContract: accountAddress as Address,
        },
        message: {
          from: {
            name: 'Cow',
            wallet: accountAddress as Address,
          },
          to: {
            name: 'Bob',
            wallet: accountAddress as Address,
          },
          contents: 'Hello, Bob!',
        },
      };
      const eipAccount = eip1271Account(accountAddress as Address, walletClientWithAccount);
      // @ts-ignore
      const signedMessage = await eipAccount.signTypedData(typedData);
      setSignature(signedMessage);

      // const valid = await eip1271Account.isValidSignature(toHex(typedData), signedMessage);
      // setIsSignatureValid(valid);
    } catch (error) {
      console.error('Error signing typed data:', error);
    }
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Enter Account Address"
        onChange={(e) => setAccountAddress(e.target.value as Address)}
      />
      <button onClick={requestAccountAccess}>Request Account Access</button>
      <button onClick={handleSignMessage}>Sign Message</button>
      <button onClick={handleTypedData}>Sign Typed Data</button>
      {signature && <p>Signed Message: {signature}</p>}
      {isSignatureValid !== null && (
        <p>Signature is {isSignatureValid ? 'valid' : 'invalid'}.</p>
      )}
    </div>
  );
};

export default App;