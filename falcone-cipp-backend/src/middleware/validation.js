import Joi from "joi";

/**
 * Middleware to validate request data against a Joi schema
 * @param {Object} schema - Joi schema with optional `body`, `params`, `query` keys
 */
export default (schema) => (req, res, next) => {
  try {
    // Collect only the parts of the request that are present
    const dataToValidate = {};
    if (req.body && Object.keys(req.body).length) dataToValidate.body = req.body;
    if (req.params && Object.keys(req.params).length) dataToValidate.params = req.params;
    if (req.query && Object.keys(req.query).length) dataToValidate.query = req.query;

    const { error } = schema.validate(dataToValidate, {
      allowUnknown: false, // disallow unknown keys
      abortEarly: true,    // stop at first error
      stripUnknown: true,  // remove unknown keys from the validated object
    });

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    next();
  } catch (err) {
    console.error("Validation middleware error:", err.message);
    return res.status(500).json({ error: "Validation middleware failed" });
  }
};
// (w3Schools, n.d.).