import type { ReactNode } from 'react';

type EmptyIllustration = 'collection' | 'discussion' | 'code' | 'progress';
type EmptyStateSize = 'compact' | 'standard';
type HeadingLevel = 2 | 3 | 4;

export function IllustratedEmptyState({
  title,
  description,
  illustration,
  size = 'standard',
  headingLevel = size === 'compact' ? 3 : 2,
  action,
}: {
  title: string;
  description: string;
  illustration: EmptyIllustration;
  size?: EmptyStateSize;
  headingLevel?: HeadingLevel;
  action?: ReactNode;
}) {
  const Heading = { 2: 'h2', 3: 'h3', 4: 'h4' }[headingLevel];

  return (
    <div
      data-size={size}
      className={`rounded-xl border border-dashed bg-card text-center ${
        size === 'compact' ? 'space-y-2 p-4' : 'space-y-3 p-6 sm:p-8'
      }`}
    >
      <EmptyIllustrationArt kind={illustration} size={size} />
      <Heading className="font-semibold">{title}</Heading>
      <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}

function EmptyIllustrationArt({
  kind,
  size,
}: {
  kind: EmptyIllustration;
  size: EmptyStateSize;
}) {
  return (
    <svg
      aria-hidden="true"
      data-illustration={kind}
      focusable="false"
      viewBox="0 0 160 112"
      className={`mx-auto text-primary ${size === 'compact' ? 'h-16 w-24' : 'h-24 w-36'}`}
      fill="none"
    >
      <ellipse cx="80" cy="101" rx="57" ry="7" className="fill-muted" />
      <circle cx="80" cy="54" r="38" className="fill-primary/5" />
      {kind === 'collection' && <CollectionArt />}
      {kind === 'discussion' && <DiscussionArt />}
      {kind === 'code' && <CodeArt />}
      {kind === 'progress' && <ProgressArt />}
    </svg>
  );
}

function CollectionArt() {
  return (
    <g className="stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M37 41h36a5 5 0 0 1 5 5v34H42a5 5 0 0 1-5-5V41Z" className="fill-background" />
      <path d="M78 47h40a5 5 0 0 1 5 5v29H78V47Z" className="fill-card" />
      <path d="M48 53h20M48 62h20M88 59h23M88 68h17" />
      <path d="m58 34 5-5 5 5" />
      <circle cx="113" cy="37" r="9" className="fill-background" />
      <path d="M113 33v8m-4-4h8" />
    </g>
  );
}

function DiscussionArt() {
  return (
    <g className="stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M39 37h51a8 8 0 0 1 8 8v23a8 8 0 0 1-8 8H62L49 87v-11h-2a8 8 0 0 1-8-8V37Z" className="fill-background" />
      <path d="M65 47h18M65 57h24" />
      <path d="M93 59h24a7 7 0 0 1 7 7v16a7 7 0 0 1-7 7h-3v8l-10-8h-11a7 7 0 0 1-7-7v-9" className="fill-card" />
      <path d="M102 71h12M102 79h7" />
    </g>
  );
}

function CodeArt() {
  return (
    <g className="stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="39" y="31" width="82" height="58" rx="8" className="fill-background" />
      <path d="M39 46h82M51 39h1m8 0h1m8 0h1" />
      <path d="m66 58-8 7 8 7m29-14 8 7-8 7m-9-15-6 16" />
      <path d="M49 99h62" />
    </g>
  );
}

function ProgressArt() {
  return (
    <g className="stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M42 85V48a6 6 0 0 1 6-6h49v43H42Z" className="fill-background" />
      <path d="M97 51h17a6 6 0 0 1 6 6v28H97V51Z" className="fill-card" />
      <path d="M52 75V63m12 12V55m12 20V68m12 7V59" />
      <path d="m103 71 5 5 9-12" />
      <path d="M53 94h55" />
    </g>
  );
}
