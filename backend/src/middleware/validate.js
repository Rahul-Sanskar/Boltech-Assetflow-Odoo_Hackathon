const AppError = require("../utils/AppError");

const extractIssues = (error) => {
  if (Array.isArray(error?.issues)) return error.issues;
  if (Array.isArray(error?.errors)) return error.errors;

  try {
    const parsed = JSON.parse(error?.message || "[]");
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {
    // ignore parse failures
  }

  return [{ path: [], message: error?.message || "Invalid input" }];
};

/**
 * Zod request validation middleware.
 * Usage: validate({ body: schema, params: schema, query: schema })
 */
const validate = (schemas = {}) => (req, res, next) => {
  try {
    const errors = [];

    for (const key of ["body", "params", "query"]) {
      if (!schemas[key]) continue;

      const result = schemas[key].safeParse(req[key] ?? {});
      if (!result.success) {
        for (const issue of extractIssues(result.error)) {
          const path = Array.isArray(issue.path) ? issue.path.join(".") : "";
          errors.push({
            field: path ? `${key}.${path}` : key,
            message: issue.message || "Invalid value"
          });
        }
      } else {
        req[key] = result.data;
      }
    }

    if (errors.length > 0) {
      return next(new AppError("Validation Failed", 400, errors));
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validate;
