# Shared UI

`pending-button.tsx` provides `PendingButton` for client actions and
`FormSubmitButton` for Next Form submissions. Pass the action's real pending
state and keep any independent disabled conditions. The spinner is decorative;
`aria-busy`, the visible action label and disabled state describe progress.

The shadcn configuration points here. Add only the components required by a feature using `pnpm exec shadcn add <component>` and review generated changes. No components from earlier MPs were copied.
