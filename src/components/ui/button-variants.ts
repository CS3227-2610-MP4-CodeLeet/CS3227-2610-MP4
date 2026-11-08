import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Shared visual language for every clickable control that looks like a
 * button, whether it renders a `<button>` or a navigation `<Link>`.
 * Keeping the classes here means header, sidebar and page actions stay
 * consistent and one change restyles them everywhere.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60 aria-busy:cursor-progress',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline:
          'border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
        ghost:
          'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2 text-sm',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
