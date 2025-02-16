"use client";

import { useState } from "react";
import { useEffect } from "react";
import { ethers } from "ethers";
import { createSignature } from './utilities';
import { Wallet, Send, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-4xl px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
            Gasless Token Transfers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Transfer ERC20 & NFT tokens without paying gas fees
          </p>
        </div>

        {/* Wallet Connection Section */}
        {account ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8 transition-all duration-300">
            <div className="flex items-center justify-center gap-3">
              <Wallet className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <p className="text-gray-700 dark:text-gray-300">
                Connected: <span className="font-mono font-medium text-violet-700 dark:text-violet-400">{account}</span>
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="mx-auto mb-8 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-medium hover:opacity-90 transition-all duration-300"
          >
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </button>
        )}

        {/* Main Form */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <div className="space-y-6">
            {/* Token Type Selection */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-3">Token Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTokenType("ERC20")}
                  className={`p-4 rounded-xl text-center transition-colors ${
                    tokenType === "ERC20"
                      ? "bg-violet-600 dark:bg-violet-500 text-white"
                      : "bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  ERC20
                </button>
                <button
                  onClick={() => setTokenType("ERC721")}
                  className={`p-4 rounded-xl text-center transition-colors ${
                    tokenType === "ERC721"
                      ? "bg-violet-600 dark:bg-violet-500 text-white"
                      : "bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  ERC721
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Token Contract</label>
                <input
                  type="text"
                  value={tokenContract}
                  onChange={(e) => setTokenContract(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-violet-400 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Recipient Address</label>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-violet-400 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {tokenType === "ERC20" ? "Amount" : "Token ID"}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.0"
                  className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-violet-400 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 transition-all outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={sendTransactionRequest}
              disabled={loading || !provider || !signer}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white p-4 rounded-xl font-medium hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  <span>Send Transaction</span>
                  <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}