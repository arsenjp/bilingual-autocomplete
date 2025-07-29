const fs = require('fs');
const path = require('path');

/**
 * Data loader utility for handling file operations
 * Provides safe file loading with error handling and validation
 */
class DataLoader {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Load sample texts from JSON file
   * @returns {Promise<Array<string>>} Array of sample texts
   */
  async loadSampleTexts() {
    const filePath = path.join('input', 'sample-texts.json');
    return this.loadJsonFile(filePath, 'sample texts');
  }

  /**
   * Load translations from JSON file
   * @returns {Promise<Object>} Translations object
   */
  async loadTranslations() {
    const filePath = path.join('input', 'translations.json');
    return this.loadJsonFile(filePath, 'translations');
  }

  /**
   * Load semantic sets from JSON file
   * @returns {Promise<Object>} Semantic sets object
   */
  async loadSemanticSets() {
    const filePath = path.join('dist', 'simple-semantic-sets.json');
    return this.loadJsonFile(filePath, 'semantic sets');
  }

  /**
   * Generic JSON file loader with caching
   * @param {string} filePath - Path to the JSON file
   * @param {string} description - Description for error messages
   * @returns {Promise<*>} Parsed JSON data
   */
  async loadJsonFile(filePath, description = 'JSON data') {
    // Check cache first
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath);
    }

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`${description} file not found: ${filePath}`);
      }

      // Read and parse file
      const fileContent = await this.readFileAsync(filePath);
      const data = JSON.parse(fileContent);

      // Validate data
      this.validateData(data, description);

      // Cache the result
      this.cache.set(filePath, data);

      return data;
    } catch (error) {
      throw new Error(`Failed to load ${description}: ${error.message}`);
    }
  }

  /**
   * Read file asynchronously
   * @param {string} filePath - Path to the file
   * @returns {Promise<string>} File content
   */
  readFileAsync(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Validate loaded data
   * @param {*} data - Data to validate
   * @param {string} description - Description for error messages
   */
  validateData(data, description) {
    if (data === null || data === undefined) {
      throw new Error(`${description} is null or undefined`);
    }

    // Specific validation for different data types
    if (description === 'sample texts') {
      if (!Array.isArray(data)) {
        throw new Error('Sample texts must be an array');
      }
      if (data.length === 0) {
        throw new Error('Sample texts array is empty');
      }
      data.forEach((text, index) => {
        if (typeof text !== 'string') {
          throw new Error(`Sample text at index ${index} is not a string`);
        }
      });
    } else if (description === 'translations') {
      if (typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Translations must be an object');
      }
      Object.entries(data).forEach(([key, value]) => {
        if (typeof key !== 'string') {
          throw new Error('Translation keys must be strings');
        }
        if (!Array.isArray(value)) {
          throw new Error(`Translation value for "${key}" must be an array`);
        }
        value.forEach((translation, index) => {
          if (typeof translation !== 'string') {
            throw new Error(`Translation at index ${index} for "${key}" is not a string`);
          }
        });
      });
    } else if (description === 'semantic sets') {
      if (typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Semantic sets must be an object');
      }
      if (!data.semanticSets || !Array.isArray(data.semanticSets)) {
        throw new Error('Semantic sets must have a "semanticSets" array property');
      }
      data.semanticSets.forEach((set, index) => {
        if (!Array.isArray(set)) {
          throw new Error(`Semantic set at index ${index} is not an array`);
        }
        set.forEach((term, termIndex) => {
          if (typeof term !== 'string') {
            throw new Error(`Term at index ${termIndex} in semantic set ${index} is not a string`);
          }
        });
      });
    }
  }

  /**
   * Save data to JSON file
   * @param {string} filePath - Path to save the file
   * @param {*} data - Data to save
   * @param {string} description - Description for error messages
   * @returns {Promise<void>}
   */
  async saveJsonFile(filePath, data, description = 'data') {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      await this.writeFileAsync(filePath, JSON.stringify(data, null, 2));
      
      // Update cache
      this.cache.set(filePath, data);
      
      console.log(`✅ Saved ${description} to ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to save ${description}: ${error.message}`);
    }
  }

  /**
   * Write file asynchronously
   * @param {string} filePath - Path to the file
   * @param {string} content - Content to write
   * @returns {Promise<void>}
   */
  writeFileAsync(filePath, content) {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Check if a file exists
   * @param {string} filePath - Path to check
   * @returns {boolean} True if file exists
   */
  fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * Get file size
   * @param {string} filePath - Path to the file
   * @returns {number} File size in bytes
   */
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get file information
   * @param {string} filePath - Path to the file
   * @returns {Object|null} File information or null if file doesn't exist
   */
  getFileInfo(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }
}

module.exports = { DataLoader }; 