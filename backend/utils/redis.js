const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Check if Redis is disabled
      if (process.env.REDIS_DISABLED === 'true') {
        console.log('Redis is disabled, skipping connection');
        return;
      }
      
      // Try Redis Cloud configuration first
      if (process.env.REDIS_HOST && process.env.REDIS_PORT && process.env.REDIS_PASSWORD) {
        this.client = redis.createClient({
          socket: {
            host: process.env.REDIS_HOST.replace(/'/g, ''),
            port: parseInt(process.env.REDIS_PORT)
          },
          password: process.env.REDIS_PASSWORD.replace(/'/g, '')
        });
      } else {
        // Fallback to URL format or local Redis
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.client = redis.createClient({
          url: redisUrl
        });
      }

      this.client.on('error', (err) => {
        console.warn('Redis Client Error (Redis disabled):', err.message);
        this.isConnected = false;
        // Don't crash the app if Redis fails
        this.client = null;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Redis connection error:', error.message);
      this.isConnected = false;
      return null;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      console.warn('Redis not connected, skipping cache get');
      return null;
    }
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error.message);
      return null;
    }
  }

  async set(key, value, expiration = 3600) {
    if (!this.isConnected || !this.client) {
      console.warn('Redis not connected, skipping cache set');
      return false;
    }

    try {
      await this.client.setEx(key, expiration, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) {
      console.warn('Redis not connected, skipping cache delete');
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error.message);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error.message);
      return false;
    }
  }

  async flushAll() {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis flush error:', error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  // Cache wrapper function
  async cache(key, fetchFunction, expiration = 3600) {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, fetch the data
      const data = await fetchFunction();
      
      // Store in cache
      await this.set(key, data, expiration);
      
      return data;
    } catch (error) {
      console.error('Cache wrapper error:', error.message);
      // If caching fails, still return the fetched data
      return await fetchFunction();
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
