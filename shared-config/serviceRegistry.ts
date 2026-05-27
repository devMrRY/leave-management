/**
 * Centralized Service Registry for microservices discovery
 * Integrates with Consul for distributed service discovery with fallback to environment variables
 */

import { consulClient } from './consulClient';

interface ServiceEntry {
  name: string;
  url: string;
  port: number;
  healthy?: boolean;
  lastHealthCheck?: Date;
  source?: 'consul' | 'env' | 'memory';
}

class ServiceRegistry {
  private services: Map<string, ServiceEntry> = new Map();
  private consulAvailable: boolean = false;
  private registeredServiceIds: Set<string> = new Set();

  constructor() {
    this.initializeConsul();
  }

  /**
   * Initialize Consul connection
   */
  private async initializeConsul(): Promise<void> {
    try {
      this.consulAvailable = await consulClient.isAvailable();
      if (this.consulAvailable) {
        console.log('✓ Connected to Consul service discovery');
      } else {
        console.warn('⚠️ Consul service discovery unavailable - using fallback mode');
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize Consul:', (error as Error).message);
      this.consulAvailable = false;
    }
  }

  /**
   * Register a service (with Consul if available, fallback to memory)
   */
  async register(name: string, host: string, port: number): Promise<void> {
    const url = `${host}:${port}`;
    const serviceId = `${name}-1`;
    const healthCheckUrl = `http://${host}:${port}/health`;

    // Always store in memory for quick access
    this.services.set(name, {
      name,
      url,
      port,
      healthy: true,
      lastHealthCheck: new Date(),
      source: 'memory'
    });

    // If Consul available, register there too
    if (this.consulAvailable) {
      try {
        const registered = await consulClient.registerService({
          ID: serviceId,
          Name: name,
          Address: host.replace('http://', '').replace('https://', ''),
          Port: port,
          Check: {
            HTTP: healthCheckUrl,
            Interval: '10s',
            Timeout: '5s',
            DeregisterCriticalServiceAfter: '30s'
          },
          Tags: ['v1']
        });

        if (registered) {
          this.registeredServiceIds.add(serviceId);
          this.services.get(name)!.source = 'consul';
          console.log(`✓ Service registered with Consul: ${name}`);
        }
      } catch (error) {
        console.warn(`⚠️ Consul registration failed for ${name}, using memory storage:`, (error as Error).message);
      }
    } else {
      console.log(`📝 Service registered (memory only): ${name} at ${url}`);
    }
  }

  /**
   * Deregister a service from Consul
   */
  async deregister(name: string): Promise<void> {
    const serviceId = `${name}-1`;

    if (this.consulAvailable && this.registeredServiceIds.has(serviceId)) {
      try {
        await consulClient.deregisterService(serviceId);
        this.registeredServiceIds.delete(serviceId);
        console.log(`✓ Service deregistered from Consul: ${name}`);
      } catch (error) {
        console.error(`✗ Failed to deregister from Consul:`, (error as Error).message);
      }
    }
  }

  /**
   * Discover a service URL by name (check Consul first, then memory, then env vars)
   */
  async discover(name: string): Promise<string | null> {
    // Try Consul first if available
    if (this.consulAvailable) {
      try {
        const result = await consulClient.discoverService(name);
        if (result) {
          // Update memory cache
          this.services.set(name, {
            name,
            url: result.url,
            port: parseInt(result.url.split(':').pop() || '0', 10),
            healthy: true,
            lastHealthCheck: new Date(),
            source: 'consul'
          });
          return result.url;
        }
      } catch (error) {
        console.warn(`⚠️ Consul discovery failed for ${name}:`, (error as Error).message);
      }
    }

    // Fall back to memory
    const service = this.services.get(name);
    if (service) {
      return service.url;
    }

    // Fall back to environment variables
    const envKey = `${name.toUpperCase().replace(/-/g, '_')}_URL`;
    const envUrl = process.env[envKey];
    if (envUrl) {
      console.warn(`⚠️ Using environment variable fallback for ${name}: ${envKey}`);
      return envUrl;
    }

    console.warn(`⚠ Service not found: ${name}`);
    return null;
  }

  /**
   * Get all registered services
   */
  getAll(): ServiceEntry[] {
    return Array.from(this.services.values());
  }

  /**
   * Check if a service is registered
   */
  isRegistered(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Update service health status
   */
  setHealthStatus(name: string, healthy: boolean): void {
    const service = this.services.get(name);
    if (service) {
      service.healthy = healthy;
      service.lastHealthCheck = new Date();
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus(name: string): boolean | null {
    const service = this.services.get(name);
    return service ? service.healthy ?? false : null;
  }

  /**
   * List all services with their status
   */
  status(): string {
    if (this.services.size === 0) {
      return 'No services registered';
    }

    return Array.from(this.services.values())
      .map(s => `${s.name}: ${s.url} (${s.healthy ? 'healthy' : 'unhealthy'}) [${s.source}]`)
      .join('\n');
  }

  /**
   * Check Consul availability
   */
  isConsulAvailable(): boolean {
    return this.consulAvailable;
  }

  /**
   * Get discovery info for debugging
   */
  getDiscoveryInfo(): { consul: { available: boolean; config: any }, services: ServiceEntry[] } {
    return {
      consul: {
        available: this.consulAvailable,
        config: this.consulAvailable ? consulClient.getConfig() : null
      },
      services: this.getAll()
    };
  }
}

// Export singleton instance
export const serviceRegistry = new ServiceRegistry();
export default serviceRegistry;
