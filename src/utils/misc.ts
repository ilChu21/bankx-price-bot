export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number
): Promise<T> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw new Error(`Operation failed after ${maxAttempts} attempts`);
};

export const isDayAt = (
  dayOfWeek: number,
  hour: number,
  minute: number
): boolean => {
  const now = new Date();

  const isDayMatch = now.getDay() === dayOfWeek;
  const isHourMatch = now.getHours() === hour;
  const isMinuteMatch = now.getMinutes() === minute;

  return isDayMatch && isHourMatch && isMinuteMatch;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
