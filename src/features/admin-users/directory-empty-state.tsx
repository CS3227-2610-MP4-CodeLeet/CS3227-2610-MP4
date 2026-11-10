import { IllustratedEmptyState } from '@/components/ui/illustrated-empty-state';

export function DirectoryEmptyState({
  isSearching,
  isFiltered,
  hasError,
}: {
  isSearching: boolean;
  isFiltered: boolean;
  hasError: boolean;
}) {
  if (isSearching) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Searching users…
      </p>
    );
  }
  if (hasError) return null;
  return (
    <IllustratedEmptyState
      title={
        isFiltered ? 'No users match your search.' : 'No registered users.'
      }
      description={
        isFiltered
          ? 'Try a different name, email address, or role.'
          : 'Registered students, instructors, and admins will appear here.'
      }
      illustration="collection"
    />
  );
}
