'use server';
/**
 * @fileOverview A Genkit flow to provide marketing tips.
 *
 * - getMarketingTip - A function that returns a marketing tip.
 * - MarketingTipOutput - The return type for the getMarketingTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MarketingTipOutputSchema = z.object({
  tip: z.string().describe('A short, actionable marketing tip.'),
});
export type MarketingTipOutput = z.infer<typeof MarketingTipOutputSchema>;

export async function getMarketingTip(): Promise<MarketingTipOutput> {
  return marketingTipFlow();
}

const marketingTipPrompt = ai.definePrompt({
  name: 'marketingTipPrompt',
  output: {schema: MarketingTipOutputSchema},
  prompt: `You are a marketing expert. Provide one short, actionable marketing tip for a small local business.
  The tip should be general enough to apply to various types of businesses like grocery stores, restaurants, or bakeries.
  Keep the tip concise, ideally one sentence.
  Focus on practical advice. Example: "Regularly update your online business profiles with fresh photos and accurate hours."`,
});

const marketingTipFlow = ai.defineFlow(
  {
    name: 'marketingTipFlow',
    outputSchema: MarketingTipOutputSchema,
  },
  async () => {
    const {output} = await marketingTipPrompt();
    return output!;
  }
);
