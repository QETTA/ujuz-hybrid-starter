/**
 * Minimal TypeScript declarations for jstat
 * We only need the Negative Binomial CDF function for the admission engine
 */

declare module 'jstat' {
  export interface NegativeBinomial {
    /**
     * Negative Binomial CDF (Cumulative Distribution Function)
     * @param k - The value at which to evaluate the CDF
     * @param r - Number of successes (alpha_post in our case)
     * @param p - Probability of success (beta_post/(beta_post+E_H) in our case)
     * @returns P(X <= k)
     */
    cdf(k: number, r: number, p: number): number;
  }

  export interface JStat {
    negbin: NegativeBinomial;
  }

  export const jStat: JStat;
}
