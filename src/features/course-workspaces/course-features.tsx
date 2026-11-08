'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  CourseFeature,
  CourseFeatureSetting,
  CourseWorkspaceRecord,
} from './contracts';
import { courseRequest, messageFor } from './course-request';

const featureLabels: {
  id: CourseFeature;
  name: string;
  description: string;
}[] = [
  {
    id: 'assessments',
    name: 'Assessments',
    description: 'Assignments and grading',
  },
  {
    id: 'ai',
    name: 'AI features',
    description: 'AI assisted feedback and help',
  },
  {
    id: 'discussions',
    name: 'Discussion forum',
    description: 'Course threads and replies',
  },
  { id: 'xp', name: 'XP', description: 'Course experience points' },
  { id: 'leaderboard', name: 'Leaderboard', description: 'Course rankings' },
];

function FeatureRow({
  feature,
  checked,
  disabled,
  onToggle,
}: {
  feature: (typeof featureLabels)[number];
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 border-b pb-3 last:border-0">
      <div>
        <p className="font-medium">{feature.name}</p>
        <p className="text-sm text-muted-foreground">{feature.description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={feature.name}
        disabled={disabled}
        onClick={onToggle}
        className={`h-7 w-12 rounded-full p-1 transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-background transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </li>
  );
}

export function CourseFeatures({
  course,
  initialFeatures,
}: {
  course: CourseWorkspaceRecord;
  initialFeatures: CourseFeatureSetting[];
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialFeatures);
  const [error, setError] = useState<string | null>(null);
  const [busyFeature, setBusyFeature] = useState<CourseFeature | null>(null);

  async function toggle(feature: CourseFeature, enabled: boolean) {
    if (busyFeature) return;
    setBusyFeature(feature);
    setError(null);
    try {
      await courseRequest(`/api/courses/${course.id}/features`, 'PUT', {
        feature,
        enabled,
      });
      setSettings((current) =>
        current.map((item) =>
          item.feature === feature ? { ...item, enabled } : item,
        ),
      );
      router.refresh();
    } catch (requestError) {
      setError(
        messageFor(requestError, 'Course feature setting could not be saved.'),
      );
    } finally {
      setBusyFeature(null);
    }
  }

  return (
    <section
      aria-labelledby="feature-settings-heading"
      className="space-y-4 rounded-xl border p-5"
    >
      <div>
        <h2 id="feature-settings-heading" className="text-xl font-semibold">
          Course features
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes apply to this course only.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <ul className="space-y-3">
        {featureLabels.map((feature) => {
          const checked =
            settings.find((item) => item.feature === feature.id)?.enabled ??
            true;
          return (
            <FeatureRow
              key={feature.id}
              feature={feature}
              checked={checked}
              disabled={busyFeature !== null}
              onToggle={() => void toggle(feature.id, !checked)}
            />
          );
        })}
      </ul>
    </section>
  );
}
