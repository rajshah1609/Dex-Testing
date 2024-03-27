const { ethers } = require("ethers");
const {
  abi: IUniswapV3PoolABI,
} = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const {
  abi: SwapRouterABI,
} = require("@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json");
const { getPoolImmutables, getPoolState } = require("./helpers");
const ERC20ABI = require("./abi.json");

require("dotenv").config();
const INFURA_URL_TESTNET = process.env.INFURA_URL_TESTNET;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const WALLET_SECRET = process.env.WALLET_SECRET;

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET); // Ropsten
const poolAddress = "0x661f9be6f8aa966e8ae762e30933e4001bd24bb8"; // FXD/SRX
const swapRouterAddress = "0xe1bcb1c502a545ee85a1881b95cdd46d394d2b2e";

const name0 = "Fathom Dollar";
const symbol0 = "FXD";
const decimals0 = 18;
const address0 = "0x49d3f7543335cf38fa10889ccff10207e22110b5";

const name1 = "Storx Token";
const symbol1 = "SRX";
const decimals1 = 18;
const address1 = "0x5d5f074837f5d4618b3916ba74de1bf9662a3fed";

async function main() {
  try {
    const poolContract = new ethers.Contract(
      poolAddress,
      IUniswapV3PoolABI,
      provider
    );

    const immutables = await getPoolImmutables(poolContract);
    const state = await getPoolState(poolContract);

    const wallet = new ethers.Wallet(WALLET_SECRET);
    const connectedWallet = wallet.connect(provider);

    const swapRouterContract = new ethers.Contract(
      swapRouterAddress,
      SwapRouterABI,
      connectedWallet // Use connected wallet to sign transactions
    );

    const inputAmount = 10;
    const amountIn = ethers.utils.parseUnits(inputAmount.toString(), decimals0);
    const amountOutMinimum = ethers.utils.parseUnits("0.01", decimals1); // Set a reasonable minimum amount for the output token

    const approvalAmount = amountIn; // No need to multiply by 10, just use amountIn
    const tokenContract0 = new ethers.Contract(address0, ERC20ABI, provider);
    const approvalResponse = await tokenContract0
      .connect(connectedWallet)
      .approve(swapRouterAddress, approvalAmount);

    // Check allowance
    const allowance = await tokenContract0.allowance(
      WALLET_ADDRESS,
      swapRouterAddress
    );
    console.log("Allowance:", allowance.toString());

    const params = {
      tokenIn: address0, // token0 is FXD
      tokenOut: address1, // token1 is SRX
      fee: immutables.fee,
      recipient: WALLET_ADDRESS,
      deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      amountIn: amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96: 0,
    };

    await new Promise((resolve) => setTimeout(resolve, 4000));

    const transaction = await swapRouterContract.exactInputSingle(params, {
      gasLimit: ethers.utils.hexlify(50000000), // Adjust gas limit as per requirement
    });

    console.log("Transaction hash:", transaction.hash);
    const receipt = await transaction.wait();
    console.log("Transaction receipt:", receipt);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
