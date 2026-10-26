export type AssignmentLanguage = 'python' | 'java';

export type AssignmentRecord = {
  id: string;
  title: string;
  instructions: string;
  language: AssignmentLanguage;
  publication_status: 'draft' | 'published';
};

export type AssignmentSummary = Omit<
  AssignmentRecord,
  'instructions' | 'publication_status'
> & {
  publication_status: 'published';
};

export type AssignmentDetail = AssignmentSummary & { instructions: string };

export const languageLabels: Record<AssignmentLanguage, string> = {
  python: 'Python',
  java: 'Java',
};
