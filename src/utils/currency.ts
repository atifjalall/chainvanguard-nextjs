type Currency = "USD" | "CVT";

const CONVERSION_RATE = 278;

export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCVT = (amount: number): string => {
  if (amount >= 1e9) {
    return `CVT ${(amount / 1e9).toFixed(2)} B`;
  } else if (amount >= 1e6) {
    return `CVT ${(amount / 1e6).toFixed(2)} M`;
  } else {
    return `CVT ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

export const formatCurrency = (
  amountInCVT: number,
  currency: Currency
): string => {
  if (currency === "USD") {
    const usdAmount = amountInCVT / CONVERSION_RATE;
    return formatUSD(usdAmount);
  } else {
    return formatCVT(amountInCVT);
  }
};

export const formatCurrencyAbbreviated = (
  amountInCVT: number,
  currency: Currency
): string => {
  if (currency === "USD") {
    const usdAmount = amountInCVT / CONVERSION_RATE;
    if (usdAmount >= 1e9) {
      return `$${(usdAmount / 1e9).toFixed(2)} B`;
    } else if (usdAmount >= 1e6) {
      return `$${(usdAmount / 1e6).toFixed(2)} M`;
    } else {
      return formatUSD(usdAmount);
    }
  } else {
    // CVT abbreviation logic (keeps previous behavior)
    if (amountInCVT >= 1e9) {
      return `CVT ${(amountInCVT / 1e9).toFixed(2)} B`;
    } else if (amountInCVT >= 1e6) {
      return `CVT ${(amountInCVT / 1e6).toFixed(2)} M`;
    } else {
      return formatCVT(amountInCVT);
    }
  }
};
