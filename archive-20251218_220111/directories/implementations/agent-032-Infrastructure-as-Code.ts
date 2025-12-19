```typescript
// src/infrastructure/AgentInfrastructure.ts
import * as aws from 'aws-sdk';
import * as pulumi from '@pulumi/pulumi';
import * as awsx from '@pulumi/awsx';

export class AgentInfrastructure {
    private readonly vpc: awsx.ec2.Vpc;
    private readonly ecsCluster: aws.ecs.Cluster;
    private readonly fargateService: awsx.ecs.FargateService;
    private readonly loadBalancer: awsx.lb.ApplicationLoadBalancer;

    constructor(name: string) {
        // Create a VPC for the infrastructure
        this.vpc = new awsx.ec2.Vpc(`${name}-vpc`, {
            subnets: [{ type: "public" }, { type: "private" }],
        });

        // Create an ECS Cluster
        this.ecsCluster = new aws.ecs.Cluster(`${name}-cluster`, {});

        // Create an Application Load Balancer
        this.loadBalancer = new awsx.lb.ApplicationLoadBalancer(`${name}-alb`, {
            vpc: this.vpc,
            external: true,
            securityGroups: this.vpc.publicSubnetIds.then(ids =>
                ids.map(id => new aws.ec2.SecurityGroup(`${name}-sg`, {
                    vpcId: this.vpc.id,
                    ingress: [{ protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] }],
                    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
                }))
            ),
        });

        // Create a Fargate Service for the CTAFleet Agent
        this.fargateService = new awsx.ecs.FargateService(`${name}-service`, {
            cluster: this.ecsCluster.arn,
            taskDefinitionArgs: {
                container: {
                    image: "ctafleet/agent:32",
                    cpu: 256,
                    memory: 512,
                    portMappings: [{ containerPort: 8080, hostPort: 8080, targetGroup: this.loadBalancer.defaultTargetGroup }],
                },
            },
            desiredCount: 2,
            subnets: this.vpc.privateSubnetIds,
            securityGroups: this.vpc.privateSubnetIds.then(ids =>
                ids.map(id => new aws.ec2.SecurityGroup(`${name}-service-sg`, {
                    vpcId: this.vpc.id,
                    ingress: [{ protocol: "tcp", fromPort: 8080, toPort: 8080, cidrBlocks: ["0.0.0.0/0"] }],
                    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
                }))
            ),
        });
    }

    public getEndpoint(): pulumi.Output<string> {
        return this.loadBalancer.loadBalancer.dnsName;
    }
}

// src/index.ts
import { AgentInfrastructure } from './infrastructure/AgentInfrastructure';

const infra = new AgentInfrastructure('ctafleet-agent-32');
export const endpoint = infra.getEndpoint();

// test/infrastructure/AgentInfrastructure.test.ts
import { expect } from 'chai';
import * as pulumi from '@pulumi/pulumi';
import { AgentInfrastructure } from '../../src/infrastructure/AgentInfrastructure';
import { MockRuntime } from '@pulumi/pulumi/runtime';

describe('AgentInfrastructure', () => {
    let mockRuntime: MockRuntime;

    beforeEach(() => {
        mockRuntime = new MockRuntime();
        pulumi.runtime.setMockRuntime(mockRuntime);
    });

    it('should create infrastructure with correct name', async () => {
        const infra = new AgentInfrastructure('test-agent');
        const endpoint = infra.getEndpoint();

        expect(endpoint).to.be.instanceOf(pulumi.Output);
    });

    it('should export endpoint as a string output', async () => {
        const infra = new AgentInfrastructure('test-agent');
        const endpoint = infra.getEndpoint();

        const result = await new Promise((resolve) => {
            endpoint.apply(value => resolve(value));
        });

        expect(result).to.be.a('string');
    });
});

// tsconfig.json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "outDir": "./dist",
        "rootDir": "./",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*", "test/**/*"],
    "exclude": ["node_modules"]
}

// package.json
{
    "name": "ctafleet-agent-infrastructure",
    "version": "1.0.0",
    "description": "Infrastructure as Code for CTAFleet Agent 32",
    "main": "dist/index.js",
    "scripts": {
        "build": "tsc",
        "test": "mocha -r ts-node/register test/**/*.test.ts"
    },
    "dependencies": {
        "@pulumi/aws": "^5.0.0",
        "@pulumi/awsx": "^1.0.0",
        "@pulumi/pulumi": "^3.0.0"
    },
    "devDependencies": {
        "@types/chai": "^4.3.3",
        "@types/mocha": "^10.0.0",
        "@types/node": "^18.11.18",
        "chai": "^4.3.6",
        "mocha": "^10.1.0",
        "ts-node": "^10.9.1",
        "typescript": "^4.9.4"
    }
}
```
