import 'reflect-metadata';
import { Container, injectable, inject, interfaces } from 'inversify';

type ServiceIdentifier<T> = string | symbol | interfaces.Newable<T> | interfaces.Abstract<T>;

interface TenantScopedContainer {
  tenantId: string;
  container: Container;
}

class DIContainer {
  private tenantContainers: Map<string, TenantScopedContainer> = new Map();

  public register<T>(identifier: ServiceIdentifier<T>, constructor: interfaces.Newable<T>, scope: 'singleton' | 'transient' | 'scoped' = 'singleton'): void {
    this.getDefaultContainer().bind<T>(identifier).to(constructor).inScope(scope);
  }

  public resolve<T>(identifier: ServiceIdentifier<T>, tenantId: string): T {
    const tenantContainer = this.getTenantContainer(tenantId);
    return tenantContainer.container.get<T>(identifier);
  }

  public registerTenant(tenantId: string): void {
    if (!this.tenantContainers.has(tenantId)) {
      const container = new Container();
      this.tenantContainers.set(tenantId, { tenantId, container });
    }
  }

  private getDefaultContainer(): Container {
    return this.getTenantContainer('default').container;
  }

  private getTenantContainer(tenantId: string): TenantScopedContainer {
    if (!this.tenantContainers.has(tenantId)) {
      throw new Error(`Tenant container for tenantId: ${tenantId} not found.`);
    }
    return this.tenantContainers.get(tenantId)!;
  }
}

const container = new DIContainer();

// Decorators
function injectable(): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata('inversify:injectable', true, target);
  };
}

function inject(identifier: ServiceIdentifier<any>): ParameterDecorator {
  return (target: object, propertyKey: string | symbol, parameterIndex: number) => {
    const existingInjectedParameters: any[] = Reflect.getOwnMetadata('inversify:inject', target, propertyKey) || [];
    existingInjectedParameters.push({ index: parameterIndex, identifier });
    Reflect.defineMetadata('inversify:inject', existingInjectedParameters, target, propertyKey);
  };
}

// Express middleware integration
function diMiddleware(req: any, res: any, next: Function) {
  const tenantId = req.headers['x-tenant-id'] || 'default';
  try {
    container.registerTenant(tenantId);
    req.container = container;
    next();
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
}

export { DIContainer, injectable, inject, diMiddleware };