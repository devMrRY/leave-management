/**
 * Consul Service Discovery Client
 * Communicates with Consul HTTP API for service registration, discovery, and health checks
 */

interface ConsulServiceConfig {
  ID: string;
  Name: string;
  Address: string;
  Port: number;
  Check?: {
    HTTP: string;
    Interval: string;
    Timeout: string;
    DeregisterCriticalServiceAfter?: string;
  };
  Tags?: string[];
}

interface ConsulServiceInstance {
  ID: string;
  Service: {
    ID: string;
    Service: string;
    Address: string;
    Port: number;
    Tags?: string[];
  };
  Checks: Array<{
    CheckID: string;
    Name: string;
    Status: string;
  }>;
}

interface ServiceDiscoveryResult {
  url: string;
  instances: ConsulServiceInstance[];
}

class ConsulClient {
  private consulUrl: string;
  private consulHost: string;
  private consulPort: number;

  constructor() {
    this.consulHost = process.env.CONSUL_HOST || 'consul';
    this.consulPort = parseInt(process.env.CONSUL_PORT || '8500', 10);
    this.consulUrl = `http://${this.consulHost}:${this.consulPort}`;
  }

  /**
   * Check if Consul is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.consulUrl}/v1/agent/self`, {
        timeout: 2000
      } as any);
      return response.ok;
    } catch (error) {
      console.warn('⚠️ Consul unavailable:', (error as Error).message);
      return false;
    }
  }

  /**
   * Register a service with Consul
   */
  async registerService(config: ConsulServiceConfig): Promise<boolean> {
    try {
      const response = await fetch(`${this.consulUrl}/v1/agent/service/register`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }

      console.log(`✓ Registered with Consul: ${config.Name} (${config.Address}:${config.Port})`);
      return true;
    } catch (error) {
      console.error('✗ Consul registration failed:', (error as Error).message);
      return false;
    }
  }

  /**
   * Deregister a service from Consul
   */
  async deregisterService(serviceId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.consulUrl}/v1/agent/service/deregister/${serviceId}`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error(`Deregistration failed: ${response.statusText}`);
      }

      console.log(`✓ Deregistered from Consul: ${serviceId}`);
      return true;
    } catch (error) {
      console.error('✗ Consul deregistration failed:', (error as Error).message);
      return false;
    }
  }

  /**
   * Discover a service and get its URL
   */
  async discoverService(serviceName: string): Promise<ServiceDiscoveryResult | null> {
    try {
      const response = await fetch(`${this.consulUrl}/v1/catalog/service/${serviceName}`);

      if (!response.ok) {
        throw new Error(`Discovery failed: ${response.statusText}`);
      }

      const instances: ConsulServiceInstance[] = await response.json();

      if (instances.length === 0) {
        console.warn(`⚠️ No instances found for service: ${serviceName}`);
        return null;
      }

      // Get healthy instances (simple filter - in production, check all services' health)
      const healthyInstances = instances.filter(
        instance => !instance.Checks || instance.Checks.every((check: any) => check.Status === 'passing')
      );

      if (healthyInstances.length === 0) {
        console.warn(`⚠️ No healthy instances for service: ${serviceName}`);
        return instances.length > 0 ? { url: this.buildServiceUrl(instances[0]), instances } : null;
      }

      // Use first healthy instance (in production, implement load balancing)
      const instance = healthyInstances[0];
      const url = this.buildServiceUrl(instance);

      return { url, instances: healthyInstances };
    } catch (error) {
      console.warn(`⚠️ Service discovery failed for ${serviceName}:`, (error as Error).message);
      return null;
    }
  }

  /**
   * Build service URL from Consul instance
   */
  private buildServiceUrl(instance: ConsulServiceInstance): string {
    const { Address, Port } = instance.Service;
    return `http://${Address}:${Port}`;
  }

  /**
   * Get all services from Consul catalog
   */
  async listServices(): Promise<Record<string, string[]>> {
    try {
      const response = await fetch(`${this.consulUrl}/v1/catalog/services`);

      if (!response.ok) {
        throw new Error(`List services failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Failed to list services:', (error as Error).message);
      return {};
    }
  }

  /**
   * Get Consul configuration info for debugging
   */
  getConfig(): { consulUrl: string; host: string; port: number } {
    return {
      consulUrl: this.consulUrl,
      host: this.consulHost,
      port: this.consulPort
    };
  }
}

// Export singleton instance
export const consulClient = new ConsulClient();
export default consulClient;
