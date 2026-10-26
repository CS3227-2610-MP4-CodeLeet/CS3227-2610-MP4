import type {
  AssignmentDetail,
  AssignmentRecord,
  AssignmentSummary,
} from './types';

function summary(record: AssignmentRecord): AssignmentSummary {
  return {
    id: record.id,
    title: record.title,
    language: record.language,
    publication_status: 'published',
  };
}

export function publishedSummaries(
  records: readonly AssignmentRecord[],
): AssignmentSummary[] {
  return records
    .filter((record) => record.publication_status === 'published')
    .map(summary)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function publishedDetail(
  records: readonly AssignmentRecord[],
  id: string,
): AssignmentDetail | null {
  const record = records.find(
    (item) => item.id === id && item.publication_status === 'published',
  );
  return record
    ? { ...summary(record), instructions: record.instructions }
    : null;
}

export function isAssignmentPreviewEnabled(
  mode: string | undefined,
  setting: string | undefined,
) {
  return mode === 'development' && setting === 'true';
}
