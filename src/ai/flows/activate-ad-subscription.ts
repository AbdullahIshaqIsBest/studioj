
'use server';

/**
 * @fileOverview A flow to activate ad subscriptions based on a WhatsApp-provided code.
 *
 * - activateAdSubscription - A function that activates the ad subscription for a business.
 * - ActivateAdSubscriptionInput - The input type for the activateAdSubscription function.
 * - ActivateAdSubscriptionOutput - The return type for the activateAdSubscription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ActivateAdSubscriptionInputSchema = z.object({
  code: z.string().describe('The WhatsApp-provided code (e.g., AbdullahSubsAd).'),
});
export type ActivateAdSubscriptionInput = z.infer<typeof ActivateAdSubscriptionInputSchema>;

const ActivateAdSubscriptionOutputSchema = z.object({
  success: z.boolean().describe('Whether the ad subscription was successfully activated.'),
  message: z.string().describe('A message indicating the status of the activation.'),
});
export type ActivateAdSubscriptionOutput = z.infer<typeof ActivateAdSubscriptionOutputSchema>;

export async function activateAdSubscription(input: ActivateAdSubscriptionInput): Promise<ActivateAdSubscriptionOutput> {
  return activateAdSubscriptionFlow(input);
}

const activateAdSubscriptionFlow = ai.defineFlow(
  {
    name: 'activateAdSubscriptionFlow',
    inputSchema: ActivateAdSubscriptionInputSchema,
    outputSchema: ActivateAdSubscriptionOutputSchema,
  },
  async input => {
    if (input.code === 'AbdullahSubsAd') {
      // Simulate successful ad activation for one month.
      return {
        success: true,
        message: 'Ad subscription activated for one month.',
      };
    } else {
      return {
        success: false,
        message: 'Invalid code provided.',
      };
    }
  }
);

