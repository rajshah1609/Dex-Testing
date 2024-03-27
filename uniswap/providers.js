// const { BaseProvider } = require("@ethersproject/providers");
const { BigNumber, ethers, providers } = require("ethers");

const { CurrentConfig, Environment } = require("./config");

// Single copies of provider and wallet
const mainnetProvider = new ethers.providers.JsonRpcProvider(
  CurrentConfig.rpc.mainnet
);
const wallet = createWallet();

// const browserExtensionProvider = createBrowserExtensionProvider();
let walletExtensionAddress = null;

// Interfaces
const TransactionState = {
  Failed: "Failed",
  New: "New",
  Rejected: "Rejected",
  Sending: "Sending",
  Sent: "Sent",
};

// Provider and Wallet Functions
function getMainnetProvider() {
  return mainnetProvider;
}

function getProvider() {
  // return CurrentConfig.env === Environment.WALLET_EXTENSION
  //   ? browserExtensionProvider
  //   : wallet.provider;

  return wallet.provider;
}

function getWalletAddress() {
  return CurrentConfig.env === Environment.WALLET_EXTENSION
    ? walletExtensionAddress
    : wallet.address;
}

async function sendTransaction(transaction) {
  if (CurrentConfig.env === Environment.WALLET_EXTENSION) {
    return sendTransactionViaExtension(transaction);
  } else {
    if (transaction.value) {
      transaction.value = BigNumber.from(transaction.value);
    }
    return sendTransactionViaWallet(transaction);
  }
}

async function connectBrowserExtensionWallet() {
  if (!window.ethereum) {
    return null;
  }

  const { ethereum } = window;
  const provider = new ethers.providers.Web3Provider(ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);

  if (accounts.length !== 1) {
    return;
  }

  walletExtensionAddress = accounts[0];
  return walletExtensionAddress;
}

// Internal Functionality
function createWallet() {
  let provider = mainnetProvider;
  if (CurrentConfig.env == Environment.LOCAL) {
    provider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.local);
  }
  return new ethers.Wallet(CurrentConfig.wallet.privateKey, provider);
}

function createBrowserExtensionProvider() {
  try {
    return new ethers.providers.Web3Provider(window?.ethereum, "any");
  } catch (e) {
    console.log("No Wallet Extension Found");
    return null;
  }
}

// Transacting with a wallet extension via a Web3 Provider
async function sendTransactionViaExtension(transaction) {
  try {
    const receipt = await browserExtensionProvider?.send(
      "eth_sendTransaction",
      [transaction]
    );
    if (receipt) {
      return TransactionState.Sent;
    } else {
      return TransactionState.Failed;
    }
  } catch (e) {
    console.log(e);
    return TransactionState.Rejected;
  }
}

async function sendTransactionViaWallet(transaction) {
  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value);
  }
  const txRes = await wallet.sendTransaction(transaction);

  let receipt = null;
  const provider = getProvider();
  if (!provider) {
    return TransactionState.Failed;
  }

  while (receipt === null) {
    try {
      receipt = await provider.getTransactionReceipt(txRes.hash);

      if (receipt === null) {
        continue;
      }
    } catch (e) {
      console.log(`Receipt error:`, e);
      break;
    }
  }

  // Transaction was successful if status === 1
  if (receipt) {
    return TransactionState.Sent;
  } else {
    return TransactionState.Failed;
  }
}

module.exports = {
  TransactionState,
  getMainnetProvider,
  getProvider,
  getWalletAddress,
  sendTransaction,
  connectBrowserExtensionWallet,
};
