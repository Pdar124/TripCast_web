import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold tracking-[0.01em] transition duration-150 hover:scale-[1.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:hover:scale-100 motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-[#169c48] dark:hover:bg-[#1db954]',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-border bg-transparent hover:border-foreground hover:bg-transparent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-[var(--tc-surface-hover)]',
        ghost: 'hover:bg-secondary hover:text-secondary-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6',
        sm: 'h-[34px] px-4 text-[13px] max-sm:h-11',
        lg: 'h-[52px] px-12 text-[15px]',
        icon: 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
