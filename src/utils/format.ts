export const roundDown = (num: number, decimals: number): string => {
  const factor = Math.pow(10, decimals);
  const roundedDownNum = Math.floor(num * factor) / factor;
  return roundedDownNum.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
