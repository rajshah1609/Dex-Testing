const {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} = require("@uniswap/sdk-core");
const {
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade,
} = require("@uniswap/v3-sdk");
const { ethers } = require("ethers");
const JSBI = require("jsbi");

const { CurrentConfig } = require("./config");
const {
  ERC20_ABI,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
} = require("./constants");
const { MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS } = require("./constants");
const { getPoolInfo } = require("./pool");
const {
  getProvider,
  getWalletAddress,
  sendTransaction,
  TransactionState,
} = require("./providers");
const { fromReadableAmount } = require("./utils");

// Define TokenTrade
let TokenTrade;

// Trading Functions

async function createTrade() {
  const poolInfo = await getPoolInfo();

  const pool = new Pool(
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out,
    CurrentConfig.tokens.poolFee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  );

  const swapRoute = new Route(
    [pool],
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out
  );

  const amountOut = await getOutputQuote(swapRoute);

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(
        CurrentConfig.tokens.amountIn,
        CurrentConfig.tokens.in.decimals
      ).toString()
    ),
    outputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.out,
      amountOut
    ),
    tradeType: TradeType.EXACT_INPUT,
  });

  return uncheckedTrade;
}

async function executeTrade(trade) {
  const walletAddress = getWalletAddress();
  const provider = getProvider();

  if (!walletAddress || !provider) {
    throw new Error("Cannot execute a trade without a connected wallet");
  }

  // Give approval to the router to spend the token
  const tokenApproval = await getTokenTransferApproval(CurrentConfig.tokens.in);

  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed;
  }

  const options = {
    slippageTolerance: new Percent(50, 10000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: walletAddress,
  };

  console.log(trade, options);

  const methodParameters = SwapRouter.swapCallParameters([trade], options);

  console.log(methodParameters);

  const tx = {
    data: methodParameters.calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  };

  const res = await sendTransaction(tx);

  return res;
}

// Helper Quoting and Pool Functions

async function getOutputQuote(route) {
  const provider = getProvider();

  if (!provider) {
    throw new Error("Provider required to get pool state");
  }

  const { calldata } = await SwapQuoter.quoteCallParameters(
    route,
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(
        CurrentConfig.tokens.amountIn,
        CurrentConfig.tokens.in.decimals
      ).toString()
    ),
    TradeType.EXACT_INPUT,
    {
      useQuoterV2: true,
    }
  );

  const quoteCallReturnData = await provider.call({
    to: QUOTER_CONTRACT_ADDRESS,
    data: calldata,
  });

  return ethers.utils.defaultAbiCoder.decode(["uint256"], quoteCallReturnData);
}

async function getTokenTransferApproval(token) {
  const provider = getProvider();
  const address = getWalletAddress();
  if (!provider || !address) {
    console.log("No Provider Found");
    return TransactionState.Failed;
  }

  try {
    const tokenContract = new ethers.Contract(
      token.address,
      ERC20_ABI,
      provider
    );

    const transaction = await tokenContract.populateTransaction.approve(
      SWAP_ROUTER_ADDRESS,
      fromReadableAmount(
        TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
        token.decimals
      ).toString()
    );

    return sendTransaction({
      ...transaction,
      from: address,
    });
  } catch (e) {
    console.error(e);
    return TransactionState.Failed;
  }
}

async function test() {
  const trade = await createTrade();
  await executeTrade(trade);
}

test();
