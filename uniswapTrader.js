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
    provider
  );

  const inputAmount = 10;
  // .001 => 1 000 000 000 000 000
  // const amountIn = ethers.utils.parseUnits(inputAmount.toString(), decimals0);
  const amountIn = parseFloat(inputAmount * 10 ** decimals0).toString();
  const amountOutMinimum = ethers.utils.parseUnits("0.01", decimals1); // Set a reasonable minimum amount for the output token

  const approvalAmount = (amountIn * 10).toString();
  const tokenContract0 = new ethers.Contract(address0, ERC20ABI, provider);
  const approvalResponse = await tokenContract0
    .connect(connectedWallet)
    .approve(swapRouterAddress, approvalAmount);

  const params = {
    tokenIn: immutables.token1,
    tokenOut: immutables.token0,
    fee: immutables.fee,
    recipient: WALLET_ADDRESS,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
    amountIn: amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: 0,
  };

  await new Promise((resolve) => setTimeout(resolve, 4000));

  const transaction = swapRouterContract
    .connect(connectedWallet)
    .exactInputSingle(params, {
      gasLimit: ethers.utils.hexlify(10000000),
    })
    .then((transaction) => {
      console.log(transaction);
    });
}

main();
