"use client";

import { useState } from "react";
import { useEffect } from "react";
import { ethers } from "ethers";
import { createSignature } from './utilities';

export default function Home() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokenType, setTokenType] = useState("ERC20");
  const [tokenContract, setTokenContract] = useState("");
  const [to, setTo] = useState("");
  const [value, setValue] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);


  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => {
        // Reset the states to prompt the user to manually connect again
        setAccount(null);
        setProvider(null);
        setSigner(null);
      });
    }
  }, []);

  const server_url = "https://gasless-token-transfer-aghnanc3ggfvhzck.centralindia-01.azurewebsites.net";

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setProvider(provider);
      setSigner(signer);
      setAccount(await signer.getAddress());
    } else {
      alert("Please install MetaMask");
    }
  };

  const sendTransactionRequest = async () => {
    if (!account) return alert("Connect wallet first");
    setLoading(true);

    try {

      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const tokType = tokenType === 'ERC20' ? 0 : 1;

      const transferRequest = {
        tokenType : tokType.toString(),
        tokenContract,
        from: account,
        to,
        value : tokType === 0 ? (ethers.parseEther(value.toString())).toString() : value.toString(),
        deadline : deadline.toString()
      };

      const signature = await createSignature(signer, tokType, tokenContract, value, deadline);

      const response = await fetch(server_url + '/relay', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferRequest, signature })
      });

      const data = await response.json();
      alert(data.success ? `Transaction sent: ${data.txHash}` : `Error: ${data.error}`);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

     return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Gasless ERC20/721 Transfers</h1>
      
      {account ? (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md text-center">
          <p className="text-gray-700">Connected: <span className="font-semibold">{account}</span></p>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-300 mb-6"
        >
          Connect Wallet
        </button>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mt-8">
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Token Type:</label>
          <select
            value={tokenType}
            onChange={(e) => setTokenType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white"
          >
            <option value="ERC20">ERC20</option>
            <option value="ERC721">ERC721</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Token Contract:</label>
          <input
            type="text"
            value={tokenContract}
            onChange={(e) => setTokenContract(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">To:</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white"
          />
        </div>
        
        <div className="mb-8">
          <label className="block text-gray-700 mb-2">
            {tokenType === "ERC20" ? "Amount" : "Token ID"}:
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white"
          />
        </div>
        
        <button
          onClick={sendTransactionRequest}
          disabled={loading || !provider || !signer}
          className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Send Gasless Transaction"}
        </button>
      </div>
    </div>
  );
}