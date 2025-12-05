import { z } from 'zod';

export const createCompanySchema = z.object({
  legalName: z
    .string()
    .min(1, 'Il nome dell\'azienda è obbligatorio')
    .min(2, 'Il nome deve avere almeno 2 caratteri')
    .max(200, 'Il nome non può superare 200 caratteri'),
  vatNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[A-Z]{0,2}[0-9]{9,13}$/i.test(val.replace(/\s/g, '')),
      'Partita IVA non valida'
    ),
  country: z
    .string()
    .min(1, 'Il paese è obbligatorio')
    .length(2, 'Codice paese non valido'),
});

export const searchCompanySchema = z.object({
  query: z
    .string()
    .min(1, 'Inserisci un termine di ricerca')
    .min(2, 'La ricerca deve contenere almeno 2 caratteri'),
  country: z.string().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type SearchCompanyInput = z.infer<typeof searchCompanySchema>;

// M&A Lead creation schema
export const createMAndALeadSchema = z.object({
  companyId: z.string().min(1, 'ID azienda obbligatorio'),
  email: z.string().email('Email non valida'),
  phone: z.string().optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Il consenso è obbligatorio per procedere' }),
  }),
  score: z.number().int().min(0).max(100).optional(),
  highlights: z.array(z.string()).optional(),
});

export type CreateMAndALeadInput = z.infer<typeof createMAndALeadSchema>;

