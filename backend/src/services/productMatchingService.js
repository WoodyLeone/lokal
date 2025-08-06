/**
 * Product Matching Service with User Tag Integration
 * Enhances AI matching using user-provided tags and implements confidence scoring
 */

const winston = require('winston');
const openaiService = require('./openaiService');
const productService = require('./productService');
const redisService = require('./redisService');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'product-matching' },
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/product-matching.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class ProductMatchingService {
  constructor() {
    this.isInitialized = false;
    this.tagValidationRules = {
      minLength: 2,
      maxLength: 50,
      allowedCharacters: /^[a-zA-Z0-9\s\-_]+$/,
      maxTagsPerVideo: 10
    };
    
    // Tag categories for better organization
    this.tagCategories = {
      product: ['laptop', 'phone', 'shoes', 'clothing', 'accessories', 'electronics'],
      brand: ['nike', 'adidas', 'apple', 'samsung', 'dell', 'hp'],
      style: ['casual', 'formal', 'sport', 'vintage', 'modern'],
      color: ['black', 'white', 'red', 'blue', 'green', 'brown'],
      material: ['leather', 'cotton', 'plastic', 'metal', 'wood']
    };
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      // Initialize OpenAI service for enhanced matching
      await openaiService.initializeCache();
      
      // Initialize product service
      await productService.initialize();
      
      this.isInitialized = true;
      logger.info('Product Matching Service initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Product Matching Service:', error);
      throw error;
    }
  }

  /**
   * Validate and process user tags
   */
  validateUserTags(tags) {
    const validationResults = {
      valid: [],
      invalid: [],
      suggestions: [],
      errors: []
    };

    if (!Array.isArray(tags)) {
      validationResults.errors.push('Tags must be an array');
      return validationResults;
    }

    // Limit number of tags
    if (tags.length > this.tagValidationRules.maxTagsPerVideo) {
      validationResults.errors.push(`Maximum ${this.tagValidationRules.maxTagsPerVideo} tags allowed`);
      return validationResults;
    }

    for (const tag of tags) {
      const cleanTag = tag.trim().toLowerCase();
      
      // Check length
      if (cleanTag.length < this.tagValidationRules.minLength) {
        validationResults.invalid.push({
          tag: cleanTag,
          reason: 'Too short'
        });
        continue;
      }

      if (cleanTag.length > this.tagValidationRules.maxLength) {
        validationResults.invalid.push({
          tag: cleanTag,
          reason: 'Too long'
        });
        continue;
      }

      // Check characters
      if (!this.tagValidationRules.allowedCharacters.test(cleanTag)) {
        validationResults.invalid.push({
          tag: cleanTag,
          reason: 'Invalid characters'
        });
        continue;
      }

      // Check for duplicates
      if (validationResults.valid.includes(cleanTag)) {
        validationResults.invalid.push({
          tag: cleanTag,
          reason: 'Duplicate tag'
        });
        continue;
      }

      validationResults.valid.push(cleanTag);
    }

    // Generate suggestions for invalid tags
    validationResults.suggestions = this.generateTagSuggestions(validationResults.invalid);

    return validationResults;
  }

  /**
   * Generate tag suggestions for invalid tags
   */
  generateTagSuggestions(invalidTags) {
    const suggestions = [];
    
    for (const invalidTag of invalidTags) {
      const tag = invalidTag.tag;
      const suggestionsForTag = [];

      // Check for similar tags in categories
      for (const [category, categoryTags] of Object.entries(this.tagCategories)) {
        for (const categoryTag of categoryTags) {
          const similarity = this.calculateStringSimilarity(tag, categoryTag);
          if (similarity > 0.7) {
            suggestionsForTag.push({
              original: tag,
              suggestion: categoryTag,
              category: category,
              similarity: similarity
            });
          }
        }
      }

      // Sort by similarity and take top 3
      suggestionsForTag.sort((a, b) => b.similarity - a.similarity);
      suggestions.push(...suggestionsForTag.slice(0, 3));
    }

    return suggestions;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Enhanced product matching using user tags
   */
  async matchProductsWithUserTags(analysisResults, userTags = [], options = {}) {
    try {
      logger.info(`Matching products with ${userTags.length} user tags`);

      // Validate user tags
      const tagValidation = this.validateUserTags(userTags);
      if (tagValidation.errors.length > 0) {
        logger.warn('Tag validation errors:', tagValidation.errors);
      }

      const validTags = tagValidation.valid;
      logger.info(`Using ${validTags.length} valid user tags for matching`);

      // Build enhanced search terms with user tags
      const enhancedSearchTerms = this.buildEnhancedSearchTerms(analysisResults, validTags);
      
      // Get product matches with enhanced scoring
      const matches = await this.getEnhancedProductMatches(enhancedSearchTerms, validTags, options);
      
      // Apply user tag confidence boost
      const boostedMatches = this.applyUserTagConfidenceBoost(matches, validTags);
      
      // Sort by enhanced confidence score
      boostedMatches.sort((a, b) => b.enhancedConfidence - a.enhancedConfidence);
      
      logger.info(`Found ${boostedMatches.length} enhanced product matches`);
      
      return {
        matches: boostedMatches,
        tagValidation: tagValidation,
        searchTerms: enhancedSearchTerms
      };

    } catch (error) {
      logger.error('Enhanced product matching failed:', error);
      throw error;
    }
  }

  /**
   * Build enhanced search terms combining AI analysis and user tags
   */
  buildEnhancedSearchTerms(analysisResults, userTags) {
    const searchTerms = [];
    
    // Extract terms from AI analysis
    for (const analysis of analysisResults) {
      if (analysis.description) {
        const terms = analysis.description.toLowerCase().split(/\s+/);
        searchTerms.push(...terms.filter(term => term.length > 2));
      }
      
      if (analysis.objectType) {
        searchTerms.push(analysis.objectType.toLowerCase());
      }
    }
    
    // Add user tags with higher weight
    for (const tag of userTags) {
      searchTerms.push(tag.toLowerCase());
      // Add variations of the tag
      const variations = this.generateTagVariations(tag);
      searchTerms.push(...variations);
    }
    
    // Remove duplicates and filter
    const uniqueTerms = [...new Set(searchTerms)];
    return uniqueTerms.filter(term => term.length > 2);
  }

  /**
   * Generate variations of user tags for better matching
   */
  generateTagVariations(tag) {
    const variations = [];
    
    // Add singular/plural variations
    if (tag.endsWith('s')) {
      variations.push(tag.slice(0, -1));
    } else {
      variations.push(tag + 's');
    }
    
    // Add common synonyms
    const synonyms = {
      'laptop': ['computer', 'notebook', 'macbook'],
      'phone': ['mobile', 'smartphone', 'cellphone'],
      'shoes': ['footwear', 'sneakers', 'boots'],
      'clothing': ['clothes', 'apparel', 'garments'],
      'accessories': ['accessory', 'addon', 'attachment']
    };
    
    if (synonyms[tag]) {
      variations.push(...synonyms[tag]);
    }
    
    return variations;
  }

  /**
   * Get enhanced product matches with user tag consideration
   */
  async getEnhancedProductMatches(searchTerms, userTags, options = {}) {
    const matches = [];
    const maxResults = options.maxResults || 20;
    
    try {
      // Get base product matches
      const baseMatches = await productService.searchProducts(searchTerms.join(' '), {
        limit: maxResults * 2, // Get more results for filtering
        ...options
      });
      
      // Enhance matches with user tag scoring
      for (const product of baseMatches) {
        const enhancedScore = this.calculateEnhancedProductScore(product, searchTerms, userTags);
        
        if (enhancedScore > 0.1) { // Minimum threshold
          matches.push({
            ...product,
            baseScore: product.relevance_score || 0,
            userTagScore: this.calculateUserTagScore(product, userTags),
            enhancedScore: enhancedScore,
            matchedTags: this.findMatchedTags(product, userTags)
          });
        }
      }
      
      return matches;
      
    } catch (error) {
      logger.error('Failed to get enhanced product matches:', error);
      return [];
    }
  }

  /**
   * Calculate enhanced product score considering user tags
   */
  calculateEnhancedProductScore(product, searchTerms, userTags) {
    const baseScore = product.relevance_score || 0;
    const userTagScore = this.calculateUserTagScore(product, userTags);
    const searchTermScore = this.calculateSearchTermScore(product, searchTerms);
    
    // Weight user tags more heavily (40% user tags, 30% search terms, 30% base score)
    const enhancedScore = (userTagScore * 0.4) + (searchTermScore * 0.3) + (baseScore * 0.3);
    
    return Math.min(1.0, enhancedScore);
  }

  /**
   * Calculate score based on user tag matches
   */
  calculateUserTagScore(product, userTags) {
    if (userTags.length === 0) return 0;
    
    let matchedTags = 0;
    let totalScore = 0;
    
    for (const tag of userTags) {
      const tagScore = this.calculateTagMatchScore(product, tag);
      if (tagScore > 0) {
        matchedTags++;
        totalScore += tagScore;
      }
    }
    
    // Bonus for multiple tag matches
    const matchBonus = matchedTags > 1 ? (matchedTags - 1) * 0.1 : 0;
    
    return Math.min(1.0, (totalScore / userTags.length) + matchBonus);
  }

  /**
   * Calculate how well a product matches a specific tag
   */
  calculateTagMatchScore(product, tag) {
    const productText = [
      product.title,
      product.description,
      product.category,
      product.brand
    ].join(' ').toLowerCase();
    
    const tagLower = tag.toLowerCase();
    
    // Exact match gets highest score
    if (productText.includes(tagLower)) {
      return 1.0;
    }
    
    // Partial match gets medium score
    if (productText.includes(tagLower.substring(0, Math.floor(tagLower.length * 0.7)))) {
      return 0.7;
    }
    
    // Similarity match gets lower score
    const similarity = this.calculateStringSimilarity(tagLower, productText);
    return similarity > 0.6 ? similarity * 0.5 : 0;
  }

  /**
   * Calculate score based on search term matches
   */
  calculateSearchTermScore(product, searchTerms) {
    const productText = [
      product.title,
      product.description,
      product.category,
      product.brand
    ].join(' ').toLowerCase();
    
    let matchedTerms = 0;
    
    for (const term of searchTerms) {
      if (productText.includes(term.toLowerCase())) {
        matchedTerms++;
      }
    }
    
    return Math.min(1.0, matchedTerms / searchTerms.length);
  }

  /**
   * Apply confidence boost based on user tags
   */
  applyUserTagConfidenceBoost(matches, userTags) {
    return matches.map(match => {
      const userTagBoost = match.userTagScore * 0.3; // 30% boost from user tags
      const enhancedConfidence = Math.min(1.0, match.enhancedScore + userTagBoost);
      
      return {
        ...match,
        enhancedConfidence: enhancedConfidence,
        confidenceBoost: userTagBoost
      };
    });
  }

  /**
   * Find which user tags matched with a product
   */
  findMatchedTags(product, userTags) {
    const matchedTags = [];
    
    for (const tag of userTags) {
      if (this.calculateTagMatchScore(product, tag) > 0.5) {
        matchedTags.push(tag);
      }
    }
    
    return matchedTags;
  }

  /**
   * Get tag suggestions based on detected objects
   */
  async getTagSuggestions(detectedObjects, analysisResults) {
    try {
      const suggestions = [];
      
      // Generate suggestions from detected objects
      for (const object of detectedObjects) {
        const objectSuggestions = await this.getObjectTagSuggestions(object);
        suggestions.push(...objectSuggestions);
      }
      
      // Generate suggestions from AI analysis
      for (const analysis of analysisResults) {
        const analysisSuggestions = await this.getAnalysisTagSuggestions(analysis);
        suggestions.push(...analysisSuggestions);
      }
      
      // Remove duplicates and sort by relevance
      const uniqueSuggestions = this.removeDuplicateSuggestions(suggestions);
      uniqueSuggestions.sort((a, b) => b.relevance - a.relevance);
      
      return uniqueSuggestions.slice(0, 20); // Return top 20 suggestions
      
    } catch (error) {
      logger.error('Failed to get tag suggestions:', error);
      return [];
    }
  }

  /**
   * Get tag suggestions for a detected object
   */
  async getObjectTagSuggestions(object) {
    const suggestions = [];
    
    // Add object name as primary suggestion
    suggestions.push({
      tag: object.class_name,
      category: 'product',
      relevance: 1.0,
      source: 'detection'
    });
    
    // Add category-based suggestions
    const categorySuggestions = this.getCategorySuggestions(object.class_name);
    suggestions.push(...categorySuggestions);
    
    return suggestions;
  }

  /**
   * Get tag suggestions from AI analysis
   */
  async getAnalysisTagSuggestions(analysis) {
    const suggestions = [];
    
    if (analysis.description) {
      // Extract key terms from description
      const terms = analysis.description.toLowerCase().split(/\s+/);
      for (const term of terms) {
        if (term.length > 3 && this.isRelevantTerm(term)) {
          suggestions.push({
            tag: term,
            category: 'description',
            relevance: 0.8,
            source: 'analysis'
          });
        }
      }
    }
    
    return suggestions;
  }

  /**
   * Get category-based tag suggestions
   */
  getCategorySuggestions(objectName) {
    const suggestions = [];
    
    // Map objects to relevant categories
    const categoryMap = {
      'laptop': ['computer', 'notebook', 'macbook', 'dell', 'hp'],
      'cell phone': ['phone', 'mobile', 'smartphone', 'iphone', 'samsung'],
      'sneakers': ['shoes', 'footwear', 'nike', 'adidas', 'running'],
      'chair': ['furniture', 'seating', 'office', 'home'],
      'table': ['furniture', 'desk', 'dining', 'wooden']
    };
    
    const objectLower = objectName.toLowerCase();
    for (const [category, tags] of Object.entries(categoryMap)) {
      if (objectLower.includes(category) || category.includes(objectLower)) {
        for (const tag of tags) {
          suggestions.push({
            tag: tag,
            category: 'category',
            relevance: 0.7,
            source: 'category'
          });
        }
      }
    }
    
    return suggestions;
  }

  /**
   * Check if a term is relevant for tagging
   */
  isRelevantTerm(term) {
    const irrelevantTerms = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return !irrelevantTerms.includes(term) && term.length > 2;
  }

  /**
   * Remove duplicate tag suggestions
   */
  removeDuplicateSuggestions(suggestions) {
    const seen = new Set();
    const unique = [];
    
    for (const suggestion of suggestions) {
      const key = suggestion.tag.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(suggestion);
      }
    }
    
    return unique;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      tagValidationRules: this.tagValidationRules,
      tagCategories: Object.keys(this.tagCategories)
    };
  }
}

module.exports = new ProductMatchingService(); 