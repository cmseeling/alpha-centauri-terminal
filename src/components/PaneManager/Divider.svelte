<script lang="ts">
  import { PaneResizer } from 'paneforge';
  import VerticalDots from 'virtual:icons/mdi/dots-vertical';
  import HorizontalDots from 'virtual:icons/mdi/dots-horizontal';
  import type { Direction } from '$lib/types';

  export let direction: Direction;
</script>

{#if direction === 'vertical'}
  <PaneResizer
    class="relative flex h-1 items-center justify-center bg-emerald-600"
    data-testid="vertical-splitter"
  >
    <div class="z-10 flex h-4 w-7 items-center justify-center">
      <HorizontalDots />
    </div>
  </PaneResizer>
{/if}
{#if direction === 'horizontal'}
  <PaneResizer
    class="relative flex w-1 items-center justify-center bg-emerald-600"
    data-testid="horizontal-splitter"
  >
    <div class="z-10 flex h-7 w-4 items-center justify-center">
      <VerticalDots />
    </div>
  </PaneResizer>
{/if}
