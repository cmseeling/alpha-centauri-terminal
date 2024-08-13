<script lang="ts">
  import { slide } from 'svelte/transition';
  import { createCollapsible, melt } from '@melt-ui/svelte'

  const {
    elements: { root, content: collapsibleContent, trigger },
    states: { open },
  } = createCollapsible();
</script>

<div use:melt={$root}>
  <div class="header">
    <button use:melt={$trigger} class="hover:underline">
      See details
    </button>
  </div>
  {#if $open}
    <div use:melt={$collapsibleContent} transition:slide={{ duration: 150 }}>
      <div class="flex flex-col">
        <div class="mx-0.5 p-1 bg-neutral-700 text-white rounded-md">
          <slot/>
        </div>
      </div>
    </div>
  {/if}
</div>