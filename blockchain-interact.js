const { ethers } = require("ethers");

module.exports = function (RED) {
  function ContractInteractNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.on("input", async function (msg) {
      try {
        const providerURL = config.providerURL;
        if (!config.providerURL) {
          throw new Error("Provider URL is missing");
        }
        const provider = new ethers.JsonRpcProvider(providerURL);

        const privateKey = config.privateKey;
        if (!config.privateKey) {
          throw new Error("Private key is missing");
        }
        const wallet = new ethers.Wallet(privateKey, provider);

        const contractAddress = config.contractAddress;
        const contractABI = config.contractABI
          ? JSON.parse(config.contractABI)
          : [];

        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          wallet
        );

        const inputArgs = msg.payload || {};

        const fnAbi = contractABI.find(
          (f) => f.name === config.scnNamefunction && f.type === "function"
        );
        if (!fnAbi) {
          throw new Error(
            `Function "${config.scnNamefunction}" not found in ABI`
          );
        }

        //get arguments in the correct order for the function
        const argsOrder = fnAbi.inputs.map((i) => i.name);
        const args = argsOrder.map((key) => inputArgs[key]);

        const tx = await contract[config.scnNamefunction](...args);

        console.log("Transaction sent! Hash:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        msg.payload = { hash: tx.hash, blockNumber: receipt.blockNumber };
        node.send(msg);
      } catch (err) {
        console.error("Error: " + err.message);
        node.error(err);
        return;
      }
    });
  }
  RED.nodes.registerType("contract-interact", ContractInteractNode);
};
