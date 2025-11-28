/**
 * Express router for cart-based recipe suggestions.
 * 
 * This router proxies requests from the frontend to the FastAPI ML service.
 * It extracts ingredient names from cart items and calls the ML service
 * to generate AI-powered recipe suggestions.
 */

const express = require('express');
const axios = require('axios');

const router = express.Router();

// ML service configuration (from environment or default to localhost)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SERVICE_TIMEOUT = parseInt(process.env.ML_SERVICE_TIMEOUT || '30000', 10);

/**
 * POST /api/recipes/from-cart
 * 
 * Generate recipe suggestions based on cart items.
 * 
 * Request body:
 *   {
 *     "items": [
 *       { "name": "Tomato", "quantity": 2 },
 *       { "name": "Onion", "quantity": 1 },
 *       ...
 *     ]
 *   }
 * 
 * Response body:
 *   {
 *     "recipes": [
 *       {
 *         "id": "uuid-string",
 *         "title": "Recipe Title",
 *         "shortDescription": "Short summary",
 *         "instructions": "Step-by-step instructions..."
 *       },
 *       ...
 *     ]
 *   }
 */
router.post('/from-cart', async (req, res) => {
  try {
    // --- Step 1: Validate request body ---
    const { items } = req.body || {};
    
    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: 'Invalid request. Expected "items" array in request body.'
      });
    }
    
    if (items.length === 0) {
      return res.status(400).json({
        error: 'Cart is empty. Please add items to generate recipe suggestions.'
      });
    }

    // --- Step 2: Extract and clean ingredient names ---
    // Use a Set to deduplicate ingredients
    const ingredientSet = new Set();
    
    items.forEach(item => {
      if (!item) return;
      
      // Fallback support: try 'name' first, then 'itemName'
      const ingredientName = item.name || item.itemName || '';
      
      if (!ingredientName) return;
      
      // Normalize: convert to string, trim, lowercase
      const cleaned = String(ingredientName)
        .trim()
        .toLowerCase();
      
      if (cleaned.length > 0) {
        ingredientSet.add(cleaned);
      }
    });
    
    const ingredients = Array.from(ingredientSet);
    
    // --- Step 3: Validate extracted ingredients ---
    if (ingredients.length === 0) {
      return res.status(400).json({
        error: 'No valid ingredient names found in cart items.'
      });
    }
    
    console.log(`[recipes_from_cart] Extracted ${ingredients.length} ingredients:`, ingredients);

    // --- Step 4: Call FastAPI ML service ---
    let mlResponse;
    try {
      mlResponse = await axios.post(
        `${ML_SERVICE_URL}/generate-recipes`,
        { ingredients },
        { timeout: ML_SERVICE_TIMEOUT }
      );
    } catch (mlError) {
      // Handle ML service errors
      console.error('[recipes_from_cart] ML service error:', mlError.message);
      
      if (mlError.response) {
        // ML service returned an error response
        const status = mlError.response.status || 502;
        const message = mlError.response.data?.detail || 
                        mlError.response.data?.error ||
                        'ML service returned an error';
        return res.status(status).json({ error: message });
      } else if (mlError.code === 'ECONNREFUSED') {
        // ML service is not running
        return res.status(502).json({
          error: 'ML service is unavailable. Please try again later.'
        });
      } else {
        // Other network errors
        return res.status(502).json({
          error: 'Failed to connect to ML service.'
        });
      }
    }

    // --- Step 5: Validate ML service response ---
    if (!mlResponse.data) {
      return res.status(502).json({
        error: 'Invalid response from ML service.'
      });
    }
    
    const { recipes } = mlResponse.data;
    
    if (!Array.isArray(recipes)) {
      return res.status(502).json({
        error: 'ML service returned invalid recipe format.'
      });
    }
    
    console.log(`[recipes_from_cart] ML service returned ${recipes.length} recipes`);

    // --- Step 6: Return recipes to frontend ---
    return res.json({ recipes });

  } catch (err) {
    // Unexpected server error
    console.error('[recipes_from_cart] Unexpected error:', err);
    return res.status(500).json({
      error: 'Failed to generate recipes. Please try again later.'
    });
  }
});

module.exports = router;