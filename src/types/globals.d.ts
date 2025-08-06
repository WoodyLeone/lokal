/**
 * Global type declarations for React Native environment
 */

declare global {
  // React Native development flag
  var __DEV__: boolean;
  
  // Metro bundler globals
  var __METRO_GLOBAL_PREFIX__: string;
  
  // Hermes JS engine globals
  var HermesInternal: any;
}

export {};