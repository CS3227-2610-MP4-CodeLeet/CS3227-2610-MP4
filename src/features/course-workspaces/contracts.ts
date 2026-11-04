export type CourseMemberRole = 'student' | 'instructor';
export type CourseLifecycle = 'active' | 'archived';
export type CourseFeature =
  'assessments' | 'ai' | 'discussions' | 'xp' | 'leaderboard';

export type CourseSummary = {
  id: string;
  owner_id: string | null;
  title: string;
  description: string;
  lifecycle: CourseLifecycle;
  is_legacy: boolean;
  role: CourseMemberRole | null;
};

export type CourseWorkspaceRecord = Omit<CourseSummary, 'role'>;

export type CourseMember = {
  user_id: string;
  email: string;
  display_name: string;
  role: CourseMemberRole;
  joined_at: string;
};

export type CourseInvitation = {
  id: string;
  email: string;
  role: CourseMemberRole;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type CourseFeatureSetting = {
  feature: CourseFeature;
  enabled: boolean;
};
