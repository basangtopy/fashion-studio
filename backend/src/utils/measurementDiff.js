// Standard measurement field names — used to filter out non-measurement fields
const MEASUREMENT_FIELDS = [
  "bust",
  "waist",
  "hips",
  "shoulderWidth",
  "sleeveLength",
  "dressLength",
  "thigh",
  "inseam",
  "neck",
  "armLength",
  "armCircumference",
  "ankleCircumference",
  "wristCircumference",
  "backLength",
  "frontLength",
];

// Compares old and new measurement data and returns only what changed
// Example return value:
// { bust: { from: 88, to: 90 }, waist: { from: 70, to: 72 } }
export const computeMeasurementDiff = (oldData, newData) => {
  const diff = {};

  for (const field of MEASUREMENT_FIELDS) {
    const oldValue = oldData[field] ?? null;
    const newValue = newData[field] ?? null;

    // Only record if the value actually changed
    if (newValue !== null && newValue !== oldValue) {
      diff[field] = { from: oldValue, to: newValue };
    }
  }

  // Handle customParams separately — compare key by key
  if (newData.customParams) {
    const oldCustom = oldData.customParams || {};
    const newCustom = newData.customParams;
    const customDiff = {};

    for (const key of Object.keys(newCustom)) {
      if (newCustom[key] !== oldCustom[key]) {
        customDiff[key] = { from: oldCustom[key] ?? null, to: newCustom[key] };
      }
    }

    if (Object.keys(customDiff).length > 0) {
      diff.customParams = customDiff;
    }
  }

  return diff;
};
