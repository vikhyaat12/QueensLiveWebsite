/**
 * Converts numerical currency amount into Indian Rupees in Words.
 * e.g. 2499.50 -> "Indian Rupees Two Thousand Four Hundred Ninety-Nine and Fifty Paise Only"
 * Handles amounts in Crores, Lakhs, Thousands, Hundreds, and Paise according to Indian numbering.
 */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertBelowThousand(n: number): string {
  let str = "";
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ONES[n % 10] : "") + " ";
  } else if (n > 0) {
    str += ONES[n] + " ";
  }
  return str.trim();
}

export function amountInWords(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "Zero Rupees Only";
  const absAmount = Math.abs(amount);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  let words = "";

  const crore = Math.floor(rupees / 10000000);
  let rem = rupees % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;

  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  const hundred = rem;

  if (crore > 0) {
    words += convertBelowThousand(crore) + " Crore ";
  }
  if (lakh > 0) {
    words += convertBelowThousand(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    words += convertBelowThousand(thousand) + " Thousand ";
  }
  if (hundred > 0) {
    words += convertBelowThousand(hundred) + " ";
  }

  words = words.trim();
  let result = words ? `Indian Rupees ${words}` : "Indian Rupees Zero";

  if (paise > 0) {
    result += ` and ${convertBelowThousand(paise)} Paise`;
  }

  result += " Only";
  return result;
}
