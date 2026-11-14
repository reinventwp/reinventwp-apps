/**
 * The Suite Pass price the story shows. The website's suitePlans.ts also opens the Freemius checkout; here the
 * card only links to reinventwp.com/suite, so this holds the price alone. Keep it in step with the website's
 * cheapest tier (Personal, 1 site).
 */
const startingPrice = (): string => "$9";

const suitePlans = { startingPrice };

export default suitePlans;
