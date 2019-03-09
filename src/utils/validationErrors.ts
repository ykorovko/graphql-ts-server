import { ValidationError } from "yup";

export const validationErrors = (error: ValidationError) =>
  error.inner.map(({ path, message }) => ({ path, message }));
