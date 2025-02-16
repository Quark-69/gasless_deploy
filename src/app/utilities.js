const { ethers } = require("ethers");

export async function createSignature(owner, tokenType, tokenContractAddress, value, deadline) {


  const server_url = "https://gasless-efbwhzbgc2csg5c4.centralindia-01.azurewebsites.net";

  const gaslessTokenTransferAddress = await (await fetch(server_url+'/gasless-addr')).text();
  const gaslessAbi = await (await fetch(server_url+'/gasless-abi')).text();
  const erc20abi = await (await fetch(server_url+'/erc20-abi')).text();
  const erc721abi = await (await fetch(server_url+'/erc721-abi')).text();
  const provider = new ethers.JsonRpcProvider("https://ethereum-holesky-rpc.publicnode.com");

  let tokenContract, gaslessContract;

  if (tokenType === 0) {
    tokenContract = new ethers.Contract(tokenContractAddress, JSON.parse(Buffer.from(erc20abi, "base64").toString("utf-8")), provider);
  }
  else {
    tokenContract = new ethers.Contract(tokenContractAddress, JSON.parse(Buffer.from(erc721abi, "base64").toString("utf-8")), provider);
  }

  // console.log(tokenContract);

  gaslessContract = new ethers.Contract(gaslessTokenTransferAddress, JSON.parse(Buffer.from(gaslessAbi, "base64").toString("utf-8")), provider);

  const [fields, name, version, chainId, verifyingContract, salt, extensions] = await tokenContract.eip712Domain();

  const domain = {
    name: name,
    version: version,
    chainId: chainId.toString(),
    verifyingContract: verifyingContract
  };

  let types, values;

  if (tokenType === 0) {
    types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    };

    values = {
      owner: await owner.getAddress(),
      spender: await gaslessContract.getAddress(),
      value: (ethers.parseEther(value.toString())).toString(),
      nonce: (await tokenContract.nonces(await owner.getAddress())).toString(),
      deadline: deadline.toString()
    };
  }
  else
  {
    types = {
      Permit: [
          { name: "spender", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
      ],
    };

    values = {
      spender: await gaslessContract.getAddress(),
      tokenId: value.toString(),
      nonce: (await tokenContract.nonces(value.toString())).toString(),
      deadline: deadline.toString()
    };
  }


  const signature = await owner.signTypedData(domain, types, values);
  return signature;
}