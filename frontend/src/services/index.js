/**
 * Services Index
 * 
 * Central export point for all API services.
 * This allows for cleaner imports in components:
 * 
 * Instead of:
 *   import tutorialService from './lib/services/tutorialService';
 *   import authService from './lib/services/authService';
 * 
 * You can use:
 *   import { tutorialService, authService } from './lib/services';
 */

export { default as authService } from './authService';
export { default as tutorialService } from './tutorialService';
export { default as labBookingService } from './labBookingService';
export { default as equipmentService } from './equipmentService';
export { default as portfolioService } from './portfolioService';
