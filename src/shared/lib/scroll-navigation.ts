export type ScrollDirective = { behavior: 'preserve' } | { behavior: 'target'; targetId: string };

export type ScrollLocationState = {
  scroll?: ScrollDirective;
};

export function scrollToTarget(targetId: string): ScrollLocationState {
  return { scroll: { behavior: 'target', targetId } };
}

export const preserveScroll: ScrollLocationState = {
  scroll: { behavior: 'preserve' },
};
