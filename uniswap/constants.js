// This file stores web3 related constants such as addresses, token definitions, ETH currency references and ABI's

const { SupportedChainId, Token } = require("@uniswap/sdk-core");

// Addresses

const POOL_FACTORY_CONTRACT_ADDRESS =
  "0x30f317a9ec0f0d06d5de0f8d248ec3506b7e4a8a";
const QUOTER_CONTRACT_ADDRESS = "0x88c1cf91b3d16ec2b06a689010121ff79c9d823a";
const SWAP_ROUTER_ADDRESS = "0xe1bcb1c502a545ee85a1881b95cdd46d394d2b2e";
const WETH_CONTRACT_ADDRESS = "0x951857744785E80e2De051c32EE7b25f9c458C42";

// Currencies and Tokens

const WETH_TOKEN = new Token(
  50,
  "0x951857744785E80e2De051c32EE7b25f9c458C42",
  18,
  "WXDC",
  "Wrapped Ether"
);

const USDC_TOKEN = new Token(
  50,
  "0x49d3f7543335cf38fa10889ccff10207e22110b5",
  18,
  "FXD",
  "Fathom Dollar"
);

// ABI's

const ERC20_ABI = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",

  // Authenticated Functions
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address _spender, uint256 _value) returns (bool)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint amount)",
];

const WETH_ABI = [
  // Wrap ETH
  "function deposit() payable",

  // Unwrap ETH
  "function withdraw(uint wad) public",
];

// Transactions

const MAX_FEE_PER_GAS = 100000000000;
const MAX_PRIORITY_FEE_PER_GAS = 100000000000;
const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = 2000;

module.exports = {
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  WETH_CONTRACT_ADDRESS,
  WETH_TOKEN,
  USDC_TOKEN,
  ERC20_ABI,
  WETH_ABI,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
};
