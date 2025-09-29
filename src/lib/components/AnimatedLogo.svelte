<script lang="ts">
	import { onMount } from 'svelte';

	// Logo animation state
	let isExpanded = $state(true); // Start expanded
	let isHovered = $state(false);

	// Show full text when expanded or hovered
	let showFullText = $derived(() => isExpanded || isHovered);

	// Initial animation setup
	onMount(() => {
		// After 2.5 seconds, collapse to ZedSet
		setTimeout(() => {
			isExpanded = false;
		}, 1500);
	});
</script>

<h1
	class="logo-container cursor-pointer text-lg font-semibold"
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
>
	<span class="logo-permanent">Zed</span><span
		class="logo-space {showFullText() ? 'expanded' : 'collapsed'}"
	></span><span class="logo-permanent">Set</span><span
		class="logo-fade {showFullText() ? 'expanded' : 'collapsed'}">tings Editor</span
	>
</h1>

<style>
	.logo-container {
		position: relative;
		min-width: 180px; /* Prevent layout shift */
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		letter-spacing: -0.02em;
		white-space: nowrap;
		display: flex;
		align-items: baseline;
	}

	.logo-permanent {
		color: hsl(var(--primary));
		font-weight: 600;
		text-shadow: 0 1px 2px hsl(var(--primary) / 0.1);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		flex-shrink: 0;
	}

	.logo-container:hover .logo-permanent {
		color: hsl(var(--ring));
		text-shadow:
			0 1px 2px hsl(var(--ring) / 0.2),
			0 2px 4px hsl(var(--primary) / 0.1);
	}

	.logo-space {
		transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
		overflow: hidden;
		flex-shrink: 0;
	}

	.logo-space.expanded {
		width: 0.3em;
		opacity: 1;
	}

	.logo-space.collapsed {
		width: 0;
		opacity: 0;
	}

	.logo-fade {
		color: hsl(var(--primary));
		font-weight: 600;
		text-shadow: 0 1px 2px hsl(var(--primary) / 0.1);
		transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
		display: inline-block;
		overflow: hidden;
		flex-shrink: 0;
		align-self: baseline;
	}

	.logo-fade.expanded {
		opacity: 1;
		max-width: 200px;
		transform: translateX(0);
	}

	.logo-fade.collapsed {
		opacity: 0;
		max-width: 0;
		transform: translateX(-10px);
	}

	.logo-container:hover .logo-fade {
		color: hsl(var(--ring));
		text-shadow:
			0 1px 2px hsl(var(--ring) / 0.2),
			0 2px 4px hsl(var(--primary) / 0.1);
	}
</style>
