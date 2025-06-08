
'use server';
/**
 * @fileOverview A Genkit flow to generate product descriptions.
 *
 * - generateProductDescription - Generates a description for a product.
 * - GenerateProductDescriptionInput - Input for the flow.
 * - GenerateProductDescriptionOutput - Output from the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  category: z.string().describe('The category of the product (e.g., Bakery, Beverage, Main Course, Groceries, Fruits, Vegetables).'),
  keywords: z.string().optional().describe('Optional keywords to include in the description (comma-separated).'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

export const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('A compelling, concise product description (2-3 sentences maximum).'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(input: GenerateProductDescriptionInput): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const productDescriptionPrompt = ai.definePrompt({
  name: 'productDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `You are a marketing assistant for a small local business in Pakistan.
Generate a compelling and concise product description (2-3 sentences maximum) for the following product.
Make it sound appealing to local customers. Use simple and clear language.

Product Name: {{{productName}}}
Category: {{{category}}}
{{#if keywords}}
Keywords to consider: {{{keywords}}}
{{/if}}

Description:
`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await productDescriptionPrompt(input);
    return output!;
  }
);

    