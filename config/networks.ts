export interface AssetConfig {
  symbol: string;
  name: string;
  type: 'coin' | 'token';
  network: 'evm' | 'evm-token' | 'tezos';
  rpcUrl?: string;
  apiUrl?: string;
  contractAddress?: string;
  address: string;
}

// Khai báo trực tiếp địa chỉ ví của ông vào đây để không bị lỗi trống biến môi trường
const MY_EVM_WALLET = '0x8bd50ecf6f8eac4d90c49bb7575c4c5894f7cef0'; 
const MY_TEZOS_WALLET = 'tz1afTtDDye7CueYDp8EvZLAX43Sw9HBiNci';
const INFURA_KEY = '5a9e189aa34c428688e0d37199ae29b2';

export const TARGET_ASSETS: AssetConfig[] = [
  {
    symbol: 'AVAX',
    name: 'AVAX',
    type: 'coin',
    network: 'evm',
    rpcUrl: `https://avalanche-mainnet.infura.io/v3/5a9e189aa34c428688e0d37199ae29b2, https://api.avax.network/ext/bc/C/rpc`,
    address: MY_EVM_WALLET, // Thay thế bằng địa chỉ ví EVM của ông
  },
  {
    symbol: 'ETH',
    name: 'ETH (NATIVE)',
    type: 'coin',
    network: 'evm',
    rpcUrl: `https://mainnet.infura.io/v3/5a9e189aa34c428688e0d37199ae29b2, https://eth.llamarpc.com`,
    address: MY_EVM_WALLET, // Thay thế bằng địa chỉ ví EVM của ông
  },
  {
    symbol: 'XTZ',
    name: 'XTZ (TEZOS)',
    type: 'coin',
    network: 'tezos',
    apiUrl: 'https://api.tzkt.io/v1/accounts/',
    address: MY_TEZOS_WALLET, // Thay thế bằng địa chỉ ví Tezos của ông
  },
  {
    symbol: 'MATIC',
    name: 'MATIC (NATIVE)',
    type: 'coin',
    network: 'evm',
    rpcUrl: `https://polygon-mainnet.infura.io/v3/5a9e189aa34c428688e0d37199ae29b2, https://polygon-bor-rpc.publicnode.com`,
    address: MY_EVM_WALLET, // Thay thế bằng địa chỉ ví EVM của ông
  },
  // Đưa USDT (Token) xuống dưới cùng để test sau cùng
  {
    symbol: 'USDT',
    name: 'USDT (ERC20)',
    type: 'token',
    network: 'evm-token',
    rpcUrl: `https://mainnet.infura.io/v3/5a9e189aa34c428688e0d37199ae29b2, https://eth.llamarpc.com`,
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    address: MY_EVM_WALLET, // Thay thế bằng địa chỉ ví EVM của ông
  },
];