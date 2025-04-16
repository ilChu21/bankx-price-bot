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
} from 'viem/chains';

export class Viem {
  private ethClient;
  private bscClient;
  private arbitrumClient;
  private polygonClient;
  private optimismClient;
  private avalancheClient;
  private baseClient;
  public contracts;

  constructor() {
    const rpcUrls = {
      eth: 'https://rpc.ankr.com/eth',
      bsc: 'https://rpc.ankr.com/bsc',
      arbitrum: 'https://rpc.ankr.com/arbitrum',
      polygon: 'https://rpc.ankr.com/polygon',
      optimism: 'https://rpc.ankr.com/optimism',
      avalanche: 'https://rpc.ankr.com/avalanche',
      base: 'https://base.llamarpc.com',
    };

    const chains = {
      eth: mainnet,
      bsc: bsc,
      arbitrum: arbitrum,
      polygon: polygon,
      optimism: optimism,
      avalanche: avalanche,
      base: base,
    };

    const createClient = (chainKey: keyof typeof rpcUrls) =>
      createPublicClient({
        chain: chains[chainKey],
        transport: fallback([http(), http(rpcUrls[chainKey])]),
      });

    this.ethClient = createClient('eth');
    this.bscClient = createClient('bsc');
    this.arbitrumClient = createClient('arbitrum');
    this.polygonClient = createClient('polygon');
    this.optimismClient = createClient('optimism');
    this.avalancheClient = createClient('avalanche');
    this.baseClient = createClient('base');

    this.contracts = this.initializeContracts();
  }

  private async getChainData(
    client: any,
    calls: {
      contract: any;
      functionName: string;
      label: string;
      decimals?: number;
    }[]
  ) {
    const results = await client.multicall({
      contracts: calls.map(({ contract, functionName }) => ({
        ...contract,
        functionName,
      })),
    });

    return calls.reduce((acc, { label, decimals = 6 }, i) => {
      acc[label] = Number(formatUnits(results[i].result as bigint, decimals));
      return acc;
    }, {} as Record<string, number>);
  }

  public async getBlockchainData() {
    const configs = {
      eth: {
        client: this.ethClient,
        calls: [
          {
            contract: this.contracts.chainlinkXag,
            functionName: 'latestAnswer',
            label: 'agPrice',
            decimals: 8,
          },
          {
            contract: this.contracts.pidEth,
            functionName: 'bankx_updated_price',
            label: 'ethBankxPrice',
          },
          {
            contract: this.contracts.pidEth,
            functionName: 'xsd_updated_price',
            label: 'ethXsdPrice',
          },
        ],
      },
      bsc: {
        client: this.bscClient,
        calls: [
          {
            contract: this.contracts.pidBsc,
            functionName: 'bankx_updated_price',
            label: 'bscBankxPrice',
          },
          {
            contract: this.contracts.pidBsc,
            functionName: 'xsd_updated_price',
            label: 'bscXsdPrice',
          },
        ],
      },
      arbitrum: {
        client: this.arbitrumClient,
        calls: [
          {
            contract: this.contracts.pidArbitrum,
            functionName: 'bankx_updated_price',
            label: 'arbitrumBankxPrice',
          },
          {
            contract: this.contracts.pidArbitrum,
            functionName: 'xsd_updated_price',
            label: 'arbitrumXsdPrice',
          },
        ],
      },
      polygon: {
        client: this.polygonClient,
        calls: [
          {
            contract: this.contracts.pidPolygon,
            functionName: 'bankx_updated_price',
            label: 'polygonBankxPrice',
          },
          {
            contract: this.contracts.pidPolygon,
            functionName: 'xsd_updated_price',
            label: 'polygonXsdPrice',
          },
        ],
      },
      optimism: {
        client: this.optimismClient,
        calls: [
          {
            contract: this.contracts.pidOptimism,
            functionName: 'bankx_updated_price',
            label: 'optimismBankxPrice',
          },
          {
            contract: this.contracts.pidOptimism,
            functionName: 'xsd_updated_price',
            label: 'optimismXsdPrice',
          },
        ],
      },
      avalanche: {
        client: this.avalancheClient,
        calls: [
          {
            contract: this.contracts.pidAvalanche,
            functionName: 'bankx_updated_price',
            label: 'avalancheBankxPrice',
          },
          {
            contract: this.contracts.pidAvalanche,
            functionName: 'xsd_updated_price',
            label: 'avalancheXsdPrice',
          },
        ],
      },
      base: {
        client: this.baseClient,
        calls: [
          {
            contract: this.contracts.pidBase,
            functionName: 'bankx_updated_price',
            label: 'baseBankxPrice',
          },
          {
            contract: this.contracts.pidBase,
            functionName: 'xsd_updated_price',
            label: 'baseXsdPrice',
          },
        ],
      },
    };

    const chainDataPromises = Object.values(configs).map((cfg) =>
      this.getChainData(cfg.client, cfg.calls)
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

    const pidAbi = parseAbi([
      'function bankx_updated_price() view returns (uint256)',
      'function xsd_updated_price() view returns (uint256)',
    ]);

    return {
      chainlinkXag: {
        address: '0x379589227b15F1a12195D3f2d90bBc9F31f95235',
        abi: chainlinkAbi,
      },
      pidEth: {
        address: '0xa6FD872F0F6cf467Cd0c2B8352d9E5046D6926A9',
        abi: pidAbi,
      },
      pidBsc: {
        address: '0x7b51Dd3B546A9e4a2a894620eCa083af252C52Db',
        abi: pidAbi,
      },
      pidArbitrum: {
        address: '0x9f5f98657E714CfbB5Af899b722685E8E7F71B7D',
        abi: pidAbi,
      },
      pidPolygon: {
        address: '0x3F0E5111785ECF0D0E25bF32bbf1a1B458757fD8',
        abi: pidAbi,
      },
      pidOptimism: {
        address: '0xbc94A15b50ebe1853A6BCe93eaECD8705909460a',
        abi: pidAbi,
      },
      pidAvalanche: {
        address: '0x3F0E5111785ECF0D0E25bF32bbf1a1B458757fD8',
        abi: pidAbi,
      },
      pidBase: {
        address: '0x284c10042E9f69d44e52B6d16E1fa33fC944E0C2',
        abi: pidAbi,
      },
    } as const;
  }
}
