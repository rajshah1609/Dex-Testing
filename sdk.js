const { ethers } = require("ethers");
const {
  ChainId,
  Token,
  TokenAmount,
  Pair,
  Route,
  Trade,
  TradeType,
  Percent,
} = require("@uniswap/sdk");
require("dotenv").config();

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.INFURA_URL_TESTNET
  );
  const wallet = new ethers.Wallet(process.env.WALLET_SECRET, provider);

  // Use the correct ChainId for Ethereum Mainnet (1)
  const weth = new Token(50, "0x06d4e57fc2f4ccc57970fa77985f3cb55655f854", 18); // WETH address
  const usdt = new Token(50, "0x49d3f7543335cf38fa10889ccff10207e22110b5", 18); // USDT address

  const wethUsdtPair = new Pair(
    new TokenAmount(weth, "1000000000000000000"), // assuming liquidity in the pool for WETH
    new TokenAmount(usdt, "1000000000000000000") // assuming liquidity in the pool for USDT
  );

  const route = new Route([wethUsdtPair], weth);

  const trade = new Trade(
    route,
    new TokenAmount(weth, "1000000000000000000"),
    TradeType.EXACT_INPUT
  );

  const slippageTolerance = new Percent("50", "10000"); // 50 bips = 0.5%
  console.log("Slippage Tolerance:", slippageTolerance); // Log the slippage tolerance object

  const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString();
  console.log("Amount Out Minimum:", amountOutMin); // Log the calculated amountOutMin

  const path = [weth.address, usdt.address];
  const to = process.env.WALLET_ADDRESS;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time

  const uniRouter02Address = "0xe1bcb1c502a545ee85a1881b95cdd46d394d2b2e"; // Uniswap Router address on Mainnet

  const uniRouterContract = new ethers.Contract(
    uniRouter02Address,
    [
      "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
    ],
    wallet
  );

  const amountOutMinString = amountOutMin.toString(); // Convert amountOutMin to string
  const amountOutMinWei = ethers.utils.parseUnits(amountOutMinString, 18); // Convert amountOutMin to wei
  const tx = await uniRouterContract.swapExactETHForTokens(
    amountOutMinWei,
    path,
    to,
    deadline,
    { value: ethers.utils.parseEther("1"), gasLimit: 90000000 } // sending 1 WETH
  );

  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("Transaction confirmed:", tx.hash);
}

main().catch(console.error);
