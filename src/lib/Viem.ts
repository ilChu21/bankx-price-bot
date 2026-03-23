import {
  createPublicClient,
  fallback,
  formatUnits,
  http,
  parseAbi,
} from 'viem';
import {
  mainnet,
  bsc,
  arbitrum,
  polygon,
  optimism,
  avalanche,
  base,
  pulsechain,
} from 'viem/chains';
import { BlockchainData } from '../types';

export class Viem {
  private ethClient;
  private bscClient;
  private arbitrumClient;
  private polygonClient;
  private optimismClient;
  private avalancheClient;
  private baseClient;
  private pulsechainClient;
  public contracts;

  constructor() {
    const rpcUrls = {
      eth: 'https://ethereum-rpc.publicnode.com',
      bsc: 'https://public-bsc-mainnet.fastnode.io',
      arbitrum: 'https://arbitrum.drpc.org',
      polygon: 'https://polygon.drpc.org',
      optimism: 'https://public-op-mainnet.fastnode.io',
      avalanche: 'https://avalanche.drpc.org',
      base: 'https://mainnet.base.org',
      pulsechain: 'https://pulsechain-rpc.publicnode.com',
    };

    const chains = {
      eth: mainnet,
      bsc: bsc,
      arbitrum: arbitrum,
      polygon: polygon,
      optimism: optimism,
      avalanche: avalanche,
      base: base,
      pulsechain: pulsechain,
    };

    const createClient = (chainKey: keyof typeof rpcUrls) =>
      createPublicClient({
        chain: chains[chainKey],
        transport: fallback([http(rpcUrls[chainKey]), http()]),
      });

    this.ethClient = createClient('eth');
    this.bscClient = createClient('bsc');
    this.arbitrumClient = createClient('arbitrum');
    this.polygonClient = createClient('polygon');
    this.optimismClient = createClient('optimism');
    this.avalancheClient = createClient('avalanche');
    this.baseClient = createClient('base');
    this.pulsechainClient = createClient('pulsechain');

    this.contracts = this.initializeContracts();
  }

  private async getChainData(
    client: any,
    calls: {
      contract: any;
      functionName: string;
      label: string;
      decimals?: number;
    }[],
  ) {
    const results = await client.multicall({
      contracts: calls.map(({ contract, functionName }) => ({
        ...contract,
        functionName,
      })),
    });

    return calls.reduce(
      (acc, { label, decimals = 18, functionName }, i) => {
        const result = results[i].result;
        if (functionName === 'getReserves' && Array.isArray(result)) {
          const reserve0 = Number(formatUnits(result[0], decimals));
          const reserve1 = Number(formatUnits(result[1], decimals));

          let price = 0;
          if (label.startsWith('eth')) {
            price = acc.ethPrice ?? 0;
          } else if (label.startsWith('bsc')) {
            price = acc.bnbPrice ?? 0;
          } else if (label.startsWith('polygon')) {
            price = acc.maticPrice ?? 0;
          } else if (label.startsWith('avalanche')) {
            price = acc.avaxPrice ?? 0;
          } else if (label.startsWith('arbitrum')) {
            price = acc.arbEthPrice ?? 0;
          } else if (label.startsWith('base')) {
            price = acc.baseEthPrice ?? 0;
          } else if (label.startsWith('optimism')) {
            price = acc.opEthPrice ?? 0;
          } else if (label.startsWith('pulsechain')) {
            price = acc.pulsePrice ?? 0;
          }

          acc[label] = reserve0 !== 0 ? (reserve1 / reserve0) * price : null;
        } else {
          acc[label] = Number(formatUnits(result as bigint, decimals));
        }
        return acc;
      },
      {} as Record<string, number | null>,
    );
  }

  public async getBlockchainData(): Promise<BlockchainData> {
    const configs = {
      eth: {
        client: this.ethClient,
        calls: [
          {
            contract: this.contracts.xagUsdOracle,
            functionName: 'latestAnswer',
            label: 'agPrice',
            decimals: 8,
          },
          {
            contract: this.contracts.ethUsdOracle,
            functionName: 'getLatestPrice',
            label: 'ethPrice',
            decimals: 8,
          },
          {
            contract: this.contracts.bankxPoolEth,
            functionName: 'getReserves',
            label: 'ethBankxPrice',
          },
          {
            contract: this.contracts.xsdPoolEth,
            functionName: 'getReserves',
            label: 'ethXsdPrice',
          },
        ],
      },
      bsc: {
        client: this.bscClient,
        calls: [
          {
            contract: this.contracts.bnbUsdOracle,
            functionName: 'getLatestPrice',
            label: 'bnbPrice',
            decimals: 8,
          },
          {
            contract: this.contracts.bankxPoolBsc,
            functionName: 'getReserves',
            label: 'bscBankxPrice',
          },
          {
            contract: this.contracts.xsdPoolBsc,
            functionName: 'getReserves',
            label: 'bscXsdPrice',
          },
        ],
      },
      arbitrum: {
        client: this.arbitrumClient,
        calls: [
          {
            contract: this.contracts.arbEthUsdOracle,
            functionName: 'getLatestPrice',
            label: 'arbEthPrice',
            decimals: 8,
          },
          {
            contract: this.contracts.bankxPoolArbitrum,
            functionName: 'getReserves',
            label: 'arbitrumBankxPrice',
          },
          {
            contract: this.contracts.xsdPoolArbitrum,
            functionName: 'getReserves',
            label: 'arbitrumXsdPrice',
          },
        ],
      },
      polygon: {
        client: this.polygonClient,
        calls: [
          {
            contract: this.contracts.maticUsdOracle,
            functionName: 'getLatestPrice',
            label: 'maticPrice',
            decimals: 8,
          },
          {
            contract: this.contracts.bankxPoolPolygon,
            functionName: 'getReserves',
            label: 'polygonBankxPrice',
          },
          {
            contract: this.contracts.xsdPoolPolygon,
            functionName: 'getReserves',
            label: 'polygonXsdPrice',
          },
        ],
      },
      optimism: {
        client: this.optimismClient,
        calls: [
          {
            contract: this.contracts.opEthUsdOracle,
            functionName: 'getLatestPrice',
            label: 'opEthPrice',
            decimals: 8,
          },
          {
            contract: this.contracts.bankxPoolOptimism,
            functionName: 'getReserves',
            label: 'optimismBankxPrice',
          },
          {
            contract: this.contracts.xsdPoolOptimism,
            functionName: 'getReserves',
            label: 'optimismXsdPrice',
          },
        ],
      },
      avalanche: {
        client: this.avalancheClient,
        calls: [
          {
            contract: this.contracts.avaxUsdOracle,
            functionName: 'getLatestPrice',
            label: 'avaxPrice',
            decimals: 8,
          },
          {
            contract: this.contracts.bankxPoolAvalanche,
            functionName: 'getReserves',
            label: 'avalancheBankxPrice',
          },
          {
            contract: this.contracts.xsdPoolAvalanche,
            functionName: 'getReserves',
            label: 'avalancheXsdPrice',
          },
        ],
      },
      base: {
        client: this.baseClient,
        calls: [
          {
            contract: this.contracts.baseEthUsdOracle,
            functionName: 'getLatestPrice',
            label: 'baseEthPrice',
            decimals: 8,
          },
          {
            contract: this.contracts.bankxPoolBase,
            functionName: 'getReserves',
            label: 'baseBankxPrice',
          },
          {
            contract: this.contracts.xsdPoolBase,
            functionName: 'getReserves',
            label: 'baseXsdPrice',
          },
        ],
      },
      pulsechain: {
        client: this.pulsechainClient,
        calls: [
          {
            contract: this.contracts.pulseUsdOracle,
            functionName: 'getLatestPrice',
            label: 'pulsePrice',
            decimals: 18,
          },
          {
            contract: this.contracts.bankxPoolPulsechain,
            functionName: 'getReserves',
            label: 'pulsechainBankxPrice',
          },
          {
            contract: this.contracts.xsdPoolPulsechain,
            functionName: 'getReserves',
            label: 'pulsechainXsdPrice',
          },
        ],
      },
    };

    const chainDataPromises = Object.values(configs).map((cfg) =>
      this.getChainData(cfg.client, cfg.calls),
    );

    const results = await Promise.all(chainDataPromises);
    const combinedData = Object.assign({}, ...results);

    const GRAMS_PER_TROY_OUNCE = 31.1034768;

    const agGramPrice = combinedData.agPrice
      ? combinedData.agPrice / GRAMS_PER_TROY_OUNCE
      : null;

    return {
      agGramPrice,
      ...combinedData,
    };
  }

  private initializeContracts() {
    const chainlinkAbi = parseAbi([
      'function latestAnswer() view returns (int256)',
    ]);

    const bankxOracleAbi = parseAbi([
      'function getLatestPrice() view returns (int256)',
    ]);

    const poolAbi = parseAbi([
      'function getReserves() view returns (uint112, uint112, uint32)',
    ]);

    return {
      xagUsdOracle: {
        address: '0x379589227b15F1a12195D3f2d90bBc9F31f95235',
        abi: chainlinkAbi,
      },
      bankxPoolEth: {
        address: '0x2147F5c02c2869E8C2d8F86471d3d7500355d698',
        abi: poolAbi,
      },
      xsdPoolEth: {
        address: '0x53f51fcDf06946AafE25F14d2f1C9B66E71Ca683',
        abi: poolAbi,
      },
      ethUsdOracle: {
        address: '0xB64Adc2dBD4106FD29AA2156965731801C76c4E5',
        abi: bankxOracleAbi,
      },
      bankxPoolBsc: {
        address: '0xfa0870077A65dBFde9052ad16B04C3e1A885CE2d',
        abi: poolAbi,
      },
      xsdPoolBsc: {
        address: '0x8A4e0e2A778dF8cE4EA5D5108FFfE690CC9Ae07a',
        abi: poolAbi,
      },
      bnbUsdOracle: {
        address: '0xfa2dcD1aaA0E3dB79A2e3b2aDb1e286C27b5cE75',
        abi: bankxOracleAbi,
      },
      bankxPoolArbitrum: {
        address: '0x1ff77d8e8e011bcf505cd4c6c110b53969fb5e84',
        abi: poolAbi,
      },
      xsdPoolArbitrum: {
        address: '0x0626A71D29f85c0fC665612623991Aa2EA2EAB62',
        abi: poolAbi,
      },
      arbEthUsdOracle: {
        address: '0xeea52f6587f788cc12d0b5a28c48e61866c076f0',
        abi: bankxOracleAbi,
      },
      bankxPoolPolygon: {
        address: '0x59cA927Ae4c900dC8091515191E39B010bec1118',
        abi: poolAbi,
      },
      xsdPoolPolygon: {
        address: '0x58421507d10A4c57a761E8AAd5382D5564A682F5',
        abi: poolAbi,
      },
      maticUsdOracle: {
        address: '0x516f6b1680bC2b6a626128De1c2A8Cc3dd72C4eA',
        abi: bankxOracleAbi,
      },
      bankxPoolOptimism: {
        address: '0x1ff77D8e8e011bCF505cd4C6C110b53969FB5E84',
        abi: poolAbi,
      },
      xsdPoolOptimism: {
        address: '0xaB1c27a3B78d9afCDe9963780af4Ff48D6b816A2',
        abi: poolAbi,
      },
      opEthUsdOracle: {
        address: '0xeeA52F6587F788cc12d0b5a28c48e61866c076F0',
        abi: bankxOracleAbi,
      },
      bankxPoolAvalanche: {
        address: '0x53f51fcDf06946AafE25F14d2f1C9B66E71Ca683',
        abi: poolAbi,
      },
      xsdPoolAvalanche: {
        address: '0x1ff77D8e8e011bCF505cd4C6C110b53969FB5E84',
        abi: poolAbi,
      },
      avaxUsdOracle: {
        address: '0xCC34E05c66569358bABCA66B6258e9eb74a843A3',
        abi: bankxOracleAbi,
      },
      bankxPoolBase: {
        address: '0x53f51fcDf06946AafE25F14d2f1C9B66E71Ca683',
        abi: poolAbi,
      },
      xsdPoolBase: {
        address: '0x1ff77D8e8e011bCF505cd4C6C110b53969FB5E84',
        abi: poolAbi,
      },
      baseEthUsdOracle: {
        address: '0xeeA52F6587F788cc12d0b5a28c48e61866c076F0',
        abi: bankxOracleAbi,
      },
      bankxPoolPulsechain: {
        address: '0x83C60740a187a0827071156091d05DF7261E0aae',
        abi: poolAbi,
      },
      xsdPoolPulsechain: {
        address: '0x30216FF7cdcF9C1c4997ED96D1ef134E29848D21',
        abi: poolAbi,
      },
      pulseUsdOracle: {
        address: '0x3382894Ab750EaD7b34db8aa2b64Fb4e1748EF53',
        abi: bankxOracleAbi,
      },
    } as const;
  }
}
