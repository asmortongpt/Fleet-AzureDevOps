#!/usr/bin/env node

/**
 * Generate Mermaid Architecture Diagrams
 * Creates various system architecture diagrams
 *
 * Usage: node generate-architecture-diagram.js [type]
 * Types: system | deployment | sequence | erd
 */

const type = process.argv[2] || 'system';

const diagrams = {
  system: `
# System Architecture Diagram

\`\`\`mermaid
graph TB
    subgraph "Client Layer"
        Web[Web Browser]
        Mobile[Mobile App]
    end

    subgraph "CDN Layer"
        CDN[Cloudflare CDN]
    end

    subgraph "API Gateway"
        Gateway[API Gateway<br/>nginx/Kong]
    end

    subgraph "Application Layer"
        Auth[Auth Service<br/>Node.js]
        Backend[Backend API<br/>Express + Prisma]
        Worker[Background Workers<br/>Bull Queue]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Primary Database)]
        Cache[(Redis<br/>Cache + Sessions)]
        Queue[(Redis<br/>Task Queue)]
        S3[S3<br/>File Storage]
    end

    subgraph "Monitoring"
        Prometheus[Prometheus]
        Grafana[Grafana]
        Sentry[Sentry]
    end

    Web --> CDN
    Mobile --> CDN
    CDN --> Gateway
    Gateway --> Auth
    Gateway --> Backend
    Backend --> DB
    Backend --> Cache
    Backend --> S3
    Backend --> Queue
    Queue --> Worker
    Worker --> DB

    Backend -.->|metrics| Prometheus
    Backend -.->|errors| Sentry
    Prometheus --> Grafana

    style Web fill:#e1f5ff
    style Mobile fill:#e1f5ff
    style Gateway fill:#fff4e6
    style Backend fill:#f3e5f5
    style DB fill:#e8f5e9
    style Cache fill:#e8f5e9
\`\`\`
`,

  deployment: `
# Deployment Architecture

\`\`\`mermaid
graph TB
    subgraph "AWS Cloud"
        subgraph "VPC"
            subgraph "Public Subnets"
                ALB[Application<br/>Load Balancer]
                NAT[NAT Gateway]
            end

            subgraph "Private Subnets"
                subgraph "EKS Cluster"
                    Node1[Worker Node 1<br/>t3.medium]
                    Node2[Worker Node 2<br/>t3.medium]
                    Node3[Worker Node 3<br/>t3.medium]
                end
            end

            subgraph "Database Subnet"
                RDS[(RDS PostgreSQL<br/>db.t3.medium<br/>Multi-AZ)]
                ElastiCache[(ElastiCache Redis<br/>cache.t3.micro)]
            end
        end

        S3Bucket[S3 Bucket<br/>Product Images]
        CloudWatch[CloudWatch<br/>Logs + Metrics]
    end

    Internet[Internet] --> ALB
    ALB --> Node1
    ALB --> Node2
    ALB --> Node3

    Node1 --> RDS
    Node2 --> RDS
    Node3 --> RDS

    Node1 --> ElastiCache
    Node2 --> ElastiCache
    Node3 --> ElastiCache

    Node1 --> S3Bucket
    Node2 --> S3Bucket
    Node3 --> S3Bucket

    Node1 -.->|logs| CloudWatch
    Node2 -.->|logs| CloudWatch
    Node3 -.->|logs| CloudWatch

    style ALB fill:#ff9800
    style RDS fill:#4caf50
    style ElastiCache fill:#4caf50
    style Node1 fill:#2196f3
    style Node2 fill:#2196f3
    style Node3 fill:#2196f3
\`\`\`
`,

  sequence: `
# API Request Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant User
    participant Browser
    participant CDN
    participant Gateway
    participant Auth
    participant Backend
    participant DB
    participant Cache

    User->>Browser: Click "Add to Cart"
    Browser->>CDN: GET /static/app.js
    CDN-->>Browser: Cached assets

    Browser->>Gateway: POST /api/cart/items<br/>{productId, quantity}
    Gateway->>Auth: Verify JWT token
    Auth-->>Gateway: Token valid

    Gateway->>Backend: Forward request
    Backend->>Cache: Check product cache
    alt Product in cache
        Cache-->>Backend: Product data
    else Product not in cache
        Backend->>DB: SELECT * FROM products
        DB-->>Backend: Product data
        Backend->>Cache: Store in cache (5min TTL)
    end

    Backend->>DB: INSERT INTO order_items
    DB-->>Backend: Success

    Backend->>Cache: Update cart session
    Cache-->>Backend: Success

    Backend-->>Gateway: 201 Created
    Gateway-->>Browser: Response
    Browser-->>User: "Added to cart"

    Note over User,Cache: Total time: ~200ms<br/>(with cache hit)
\`\`\`
`,

  erd: `
# Entity Relationship Diagram

\`\`\`mermaid
erDiagram
    USERS ||--o{ CUSTOMERS : "has"
    USERS ||--o{ REFRESH_TOKENS : "has"
    USERS }o--|| LOCATIONS : "assigned_to"

    CUSTOMERS ||--o{ ORDERS : "places"
    CUSTOMERS }o--|| LOCATIONS : "prefers"

    PRODUCTS ||--o{ PRODUCT_IMAGES : "has"
    PRODUCTS ||--o{ INVENTORY : "tracked_in"
    PRODUCTS ||--o{ ORDER_ITEMS : "included_in"

    LOCATIONS ||--o{ INVENTORY : "stores"
    LOCATIONS ||--o{ ORDERS : "fulfills"

    ORDERS ||--|{ ORDER_ITEMS : "contains"
    ORDERS ||--|| PAYMENTS : "has"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        enum role
        uuid location_id FK
        boolean is_active
    }

    CUSTOMERS {
        uuid id PK
        uuid user_id FK
        string phone
        string address
        int loyalty_points
    }

    PRODUCTS {
        uuid id PK
        string sku UK
        string name
        string brand
        decimal price
        boolean is_active
    }

    INVENTORY {
        uuid id PK
        uuid product_id FK
        uuid location_id FK
        int quantity_on_hand
        int quantity_reserved
    }

    ORDERS {
        uuid id PK
        uuid customer_id FK
        uuid location_id FK
        enum status
        decimal total_amount
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
    }
\`\`\`
`,
};

if (!diagrams[type]) {
  console.error(`Unknown diagram type: ${type}`);
  console.error('Available types: system, deployment, sequence, erd');
  process.exit(1);
}

console.log(diagrams[type]);
