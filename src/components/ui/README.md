# Shared UI

`pending-button.tsx` provides `PendingButton` for client actions and
`FormSubmitButton` for Next Form submissions. Pass the action's real pending
state and keep any independent disabled conditions. The spinner is decorative;
`aria-busy`, the visible action label and disabled state describe progress.

`button-variants.ts` holds the shared button classes (CVA) used by buttons and
button-styled links. `pending-link.tsx` provides `PendingLink`, `ButtonLink`
and `LinkPendingSpinner`, which use Next's `useLinkStatus` to show a spinner
while a link's destination loads. `route-loading.tsx` is the shared fallback
rendered by every route `loading.tsx`.

The shadcn configuration points here. Add only the components required by a feature using `pnpm exec shadcn add <component>` and review generated changes. No components from earlier MPs were copied.
