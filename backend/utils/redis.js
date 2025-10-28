const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isDisabled = process.env.REDIS_DISABLED === 'true';
    this.connectionAttempts = 0;
    this.maxRetries = 3;
  }

  async connect() {
    try {
      // Skip connection if Redis is disabled
      if (this.isDisabled) {
        console.log('ℹ️ Redis is disabled via REDIS_DISABLED=true');
        return null;
      }

      // Prevent multiple connection attempts
      if (this.isConnected && this.client) {
        return this.client;
      }

      this.connectionAttempts++;
      
      // Try Redis Cloud configuration first
      if (process.env.REDIS_HOST && process.env.REDIS_PORT && process.env.REDIS_PASSWORD) {
        this.client = redis.createClient({
          socket: {
            host: process.env.REDIS_HOST.replace(/'/g, ''),
            port: parseInt(process.env.REDIS_PORT),
            connectTimeout: 5000,
            commandTimeout: 3000,
          },
          password: process.env.REDIS_PASSWORD.replace(/'/g, ''),
          retry_delay_on_failure: 1000,
        });
      } else {
        // Fallback to URL format or local Redis
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.client = redis.createClient({
          url: redisUrl,
          retry_delay_on_failure: 1000,
          socket: {
            connectTimeout: 5000,
            commandTimeout: 3000,
          }
        });
      }

      // Set up event handlers
      this.client.on('error', (err) => {
        console.warn(`⚠️ Redis Error (Attempt ${this.connectionAttempts}/${this.maxRetries}):`, err.message);
        this.isConnected = false;
        
        // Disable Redis if max retries exceeded
        if (this.connectionAttempts >= this.maxRetries) {
          console.warn('🔴 Redis disabled due to connection failures');
          this.isDisabled = true;
          this.cleanup();
        }
      });

      this.client.on('connect', () => {
        console.log('✅ Redis Client Connected');
        this.isConnected = true;
        this.connectionAttempts = 0; // Reset on successful connection
      });

      this.client.on('disconnect', () => {
        console.log('🔌 Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error(`❌ Redis connection failed (Attempt ${this.connectionAttempts}/${this.maxRetries}):`, error.message);
      this.isConnected = false;
      
      if (this.connectionAttempts >= this.maxRetries) {
        console.warn('🔴 Redis permanently disabled due to connection failures');
        this.isDisabled = true;
        this.cleanup();
      }
      
      return null;
    }
  }

  cleanup() {
    if (this.client) {
      try {
        this.client.removeAllListeners();
        this.client.quit();
      } catch (err) {
        // Ignore cleanup errors
      }
      this.client = null;
    }
    this.isConnected = false;
  }

  async get(key) {
    // Fast return if Redis is disabled or not available
    if (this.isDisabled || !this.isConnected || !this.client) {
      return null;
    }
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn(`⚠️ Redis GET error for key "${key}":`, error.message);
      return null;
    }
  }

  async set(key, value, expiration = 3600) {
    // Fast return if Redis is disabled or not available
    if (this.isDisabled || !this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.setEx(key, expiration, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`⚠️ Redis SET error for key "${key}":`, error.message);
      return false;
    }
  }

  async del(key) {
    // Fast return if Redis is disabled or not available
    if (this.isDisabled || !this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.warn(`⚠️ Redis DEL error for key "${key}":`, error.message);
      return false;
    }
  }

  async exists(key) {
    // Fast return if Redis is disabled or not available
    if (this.isDisabled || !this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.warn(`⚠️ Redis EXISTS error for key "${key}":`, error.message);
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
      console.warn('⚠️ Redis FLUSHALL error:', error.message);
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
      }
    } catch (error) {
      console.warn('⚠️ Redis disconnect error:', error.message);
    } finally {
      this.cleanup();
    }
  }

  // Improved cache wrapper with better error handling
  async cache(key, fetchFunction, expiration = 3600) {
    // Always try to fetch from cache first
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, fetch the data
    try {
      const data = await fetchFunction();
      
      // Try to store in cache (non-blocking)
      this.set(key, data, expiration).catch(error => {
        console.warn(`⚠️ Failed to cache data for key "${key}":`, error.message);
      });
      
      return data;
    } catch (error) {
      console.error('Cache wrapper error:', error.message);
      // If fetchFunction fails, re-throw the error
      throw error;
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
