export const QUESTION_SELECT = `
  SELECT q.*, u.name AS author_name,
         (SELECT COUNT(*)::int FROM answers a WHERE a.question_id = q.id) AS answers_count
  FROM questions q
  JOIN users u ON u.id = q.author_id
`;

export interface QuestionInput {
  title?: string;
  body?: string;
  discipline?: string;
}

export function validateQuestion({ title, body, discipline }: QuestionInput): string | null {
  if (!title || title.trim().length < 10) return 'Заголовок має бути не менше 10 символів';
  if (!body || body.trim().length < 20) return 'Текст запитання має бути не менше 20 символів';
  if (!discipline || discipline.trim() === '') return 'Вкажіть дисципліну';
  return null;
}

export function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(t => t);
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(t => t);
  return [];
}