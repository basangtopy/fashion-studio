// Success response — for successful operations
export const successResponse = (
  res,
  statusCode = 200,
  message,
  data = null,
) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

// Error response — for expected business errors (not thrown errors)
export const errorResponse = (res, statusCode = 400, message) => {
  return res.status(statusCode).json({ success: false, message });
};
