// src/ctaFleetAgent66.ts
import { ethers } from 'ethers';
import { expect } from 'chai';

interface ContractConfig {
  address: string;
  abi: any[];
}

class CTAFleetAgent66 {
  private provider: ethers.providers.JsonRpcProvider;
  private contract: ethers.Contract | null = null;
  private config: ContractConfig;

  constructor(rpcUrl: string, config: ContractConfig) {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.config = config;
    this.initializeContract();
  }

  private initializeContract(): void {
    try {
      this.contract = new ethers.Contract(
        this.config.address,
        this.config.abi,
        this.provider
      );
    } catch (error) {
      throw new Error(`Failed to initialize contract: ${error.message}`);
    }
  }

  public async getContractBalance(): Promise<bigint> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    try {
      const balance = await this.provider.getBalance(this.config.address);
      return balance.toBigInt();
    } catch (error) {
      throw new Error(`Failed to fetch contract balance: ${error.message}`);
    }
  }

  public async callContractMethod(method: string, params: any[] = []): Promise<any> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    try {
      const result = await this.contract[method](...params);
      return result;
    } catch (error) {
      throw new Error(`Failed to call contract method ${method}: ${error.message}`);
    }
  }
}

export default CTAFleetAgent66;

// test/ctaFleetAgent66.test.ts
import { expect } from 'chai';
import { ethers } from 'ethers';
import CTAFleetAgent66 from '../src/ctaFleetAgent66';

// Mock contract ABI for testing
const mockAbi = [
  {
    inputs: [],
    name: 'getValue',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

describe('CTAFleetAgent66 Contract Testing', () => {
  let agent: CTAFleetAgent66;
  let mockProvider: ethers.providers.JsonRpcProvider;
  const mockContractAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const rpcUrl = 'http://localhost:8545'; // Mock RPC URL for testing

  beforeEach(() => {
    mockProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
    agent = new CTAFleetAgent66(rpcUrl, {
      address: mockContractAddress,
      abi: mockAbi,
    });
  });

  it('should initialize contract correctly', () => {
    expect(agent).to.be.instanceOf(CTAFleetAgent66);
  });

  it('should throw error if contract initialization fails', () => {
    expect(() => {
      new CTAFleetAgent66(rpcUrl, {
        address: 'invalid_address',
        abi: mockAbi,
      });
    }).to.throw('Failed to initialize contract');
  });

  it('should get contract balance', async () => {
    // Mock provider balance response
    const mockBalance = ethers.BigNumber.from('1000000000000000000'); // 1 ETH
    sinon.stub(mockProvider, 'getBalance').resolves(mockBalance);

    const balance = await agent.getContractBalance();
    expect(balance).to.equal(BigInt('1000000000000000000'));
  });

  it('should throw error if contract not initialized for balance check', () => {
    const invalidAgent = new CTAFleetAgent66(rpcUrl, {
      address: mockContractAddress,
      abi: mockAbi,
    });
    // Simulate contract not initialized by setting private contract to null
    (invalidAgent as any).contract = null;

    expect(() => invalidAgent.getContractBalance()).to.throw('Contract not initialized');
  });

  it('should call contract method successfully', async () => {
    // Mock contract method response
    const mockValue = ethers.BigNumber.from('42');
    sinon.stub((agent as any).contract, 'getValue').resolves(mockValue);

    const result = await agent.callContractMethod('getValue');
    expect(result.toString()).to.equal('42');
  });

  it('should throw error if contract method call fails', async () => {
    sinon.stub((agent as any).contract, 'getValue').rejects(new Error('Method call failed'));

    await expect(agent.callContractMethod('getValue')).to.be.rejectedWith(
      'Failed to call contract method getValue: Method call failed'
    );
  });

  it('should throw error if contract not initialized for method call', () => {
    const invalidAgent = new CTAFleetAgent66(rpcUrl, {
      address: mockContractAddress,
      abi: mockAbi,
    });
    // Simulate contract not initialized
    (invalidAgent as any).contract = null;

    expect(() => invalidAgent.callContractMethod('getValue')).to.throw('Contract not initialized');
  });
});

// package.json
{
  "name": "cta-fleet-agent-66",
  "version": "1.0.0",
  "description": "Contract Testing Agent for CTAFleet",
  "main": "dist/ctaFleetAgent66.js",
  "types": "dist/ctaFleetAgent66.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "mocha -r ts-node/register 'test/**/*.test.ts'",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "ethers": "^5.7.2"
  },
  "devDependencies": {
    "@types/chai": "^4.3.4",
    "@types/mocha": "^10.0.1",
    "@types/node": "^18.11.18",
    "@typescript-eslint/eslint-plugin": "^5.48.0",
    "@typescript-eslint/parser": "^5.48.0",
    "chai": "^4.3.7",
    "eslint": "^8.31.0",
    "mocha": "^10.2.0",
    "sinon": "^15.0.1",
    "ts-node": "^10.9.1",
    "typescript": "^4.9.4"
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "test"]
}
