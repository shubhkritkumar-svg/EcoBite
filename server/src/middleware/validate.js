import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, property = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[property]);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || property,
      message: issue.message,
    }));
    return next(new ApiError(400, 'Please check the highlighted fields.', errors));
  }
  req[property] = result.data;
  next();
};
