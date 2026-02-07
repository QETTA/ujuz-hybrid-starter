import { Router } from 'express';
import { createRateLimiter } from '../middleware/rateLimit.js';
import {
  nearbyQuerySchema,
  placeIdParamSchema,
  searchQuerySchema
} from '../validators/places.validator.js';
import {
  fetchNearbyPlaces,
  fetchPlaceById,
  searchPlaces
} from '../services/placesService.js';
import { AppError } from '@ujuz/shared';

const router = Router();

const nearbyLimiter = createRateLimiter({ windowMs: 60_000, max: 100 });
const searchLimiter = createRateLimiter({ windowMs: 60_000, max: 200 });
const detailLimiter = createRateLimiter({ windowMs: 60_000, max: 200 });

router.get('/nearby', nearbyLimiter, async (req, res, next) => {
  try {
    const query = nearbyQuerySchema.parse(req.query);
    const data = await fetchNearbyPlaces(query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/search', searchLimiter, async (req, res, next) => {
  try {
    const query = searchQuerySchema.parse(req.query);
    const data = await searchPlaces(query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', detailLimiter, async (req, res, next) => {
  try {
    const params = placeIdParamSchema.parse(req.params);
    const data = await fetchPlaceById(params.id);

    if (!data) {
      throw new AppError('Place not found', 404, 'place_not_found');
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
