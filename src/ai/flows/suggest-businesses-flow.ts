
'use server';
/**
 * @fileOverview A Genkit flow to suggest businesses to users.
 *
 * - suggestBusinesses - Suggests a few businesses from a given list.
 * - SuggestBusinessesInput - Input for the flow.
 * - SuggestBusinessesOutput - Output from the flow.
 * - SuggestedBusiness - Type for an individual suggested business.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { BusinessCategory } from '@/contexts/AppContext';


const BusinessInfoSchema = z.object({
  id: z.string().describe('The unique ID of the business.'),
  name: z.string().describe('The name of the business.'),
  description: z.string().describe('A brief description of the business.'),
  category: z.string().describe('The category of the business (e.g., Restaurant & Cafe, Grocery & Farm Goods).')
});

const SuggestBusinessesInputSchema = z.object({
  businesses: z.array(BusinessInfoSchema).describe('A list of businesses to choose from.'),
  count: z.number().optional().default(3).describe('The number of businesses to suggest.'),
  // userPreference: z.string().optional().describe('Optional user preference, e.g., "looking for spicy food" or "organic vegetables".')
});
export type SuggestBusinessesInput = z.infer<typeof SuggestBusinessesInputSchema>;


const SuggestedBusinessSchema = z.object({
  businessId: z.string().describe('The ID of the suggested business.'),
  name: z.string().describe('The name of the suggested business.'),
  reason: z.string().describe('A short (1-2 sentences) reason why this business is suggested.'),
});
export type SuggestedBusiness = z.infer<typeof SuggestedBusinessSchema>;

const SuggestBusinessesOutputSchema = z.object({
  suggestions: z.array(SuggestedBusinessSchema).describe('A list of suggested businesses with reasons.'),
});
export type SuggestBusinessesOutput = z.infer<typeof SuggestBusinessesOutputSchema>;


export async function suggestBusinesses(input: SuggestBusinessesInput): Promise<SuggestBusinessesOutput> {
  return suggestBusinessesFlow(input);
}

const businessSuggestionPrompt = ai.definePrompt({
  name: 'businessSuggestionPrompt',
  input: {schema: SuggestBusinessesInputSchema},
  output: {schema: SuggestBusinessesOutputSchema},
  prompt: `You are a helpful local guide for SabziNow, an online platform connecting users with local businesses in Pakistan.
Your task is to suggest a few interesting businesses to a user from the provided list.
Aim to suggest {{{count}}} businesses. If fewer businesses are available than the requested count, suggest all of them.
For each suggestion, provide a compelling and concise reason (1-2 sentences) why the user might find this business interesting or useful.
Consider variety in your suggestions if possible (e.g., different categories, unique offerings).
Focus on making the businesses sound appealing to someone looking for local products or services.

Here is the list of available businesses:
{{#each businesses}}
- ID: {{id}}, Name: "{{name}}", Category: "{{category}}", Description: "{{description}}"
{{/each}}

{{#if userPreference}}
The user has expressed a preference for: "{{userPreference}}"
Please try to tailor your suggestions based on this preference if possible.
{{/if}}

Provide your suggestions in the format specified by the output schema.
Ensure the 'reason' field is engaging and highlights what makes the business stand out based on its name, category, and description.
Example reason: "Karachi Kuisine offers a taste of authentic city flavors, perfect if you're craving traditional biryani or haleem."
Another example reason: "Fresh Farms Co. is a great choice for healthy, organic produce directly from the source."
`,
});

const suggestBusinessesFlow = ai.defineFlow(
  {
    name: 'suggestBusinessesFlow',
    inputSchema: SuggestBusinessesInputSchema,
    outputSchema: SuggestBusinessesOutputSchema,
  },
  async (input) => {
    if (!input.businesses || input.businesses.length === 0) {
        return { suggestions: [] };
    }
    const {output} = await businessSuggestionPrompt(input);
    return output!;
  }
);
