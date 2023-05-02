<script type="ts">
    import { loadKeyModel } from "../lib/minion";
    import Chat from "./Chat.svelte";
    import Setup from "./Setup.svelte";

    // gets active window
    let conf = loadKeyModel();
</script>

<div class="w-96 h-96 flex flex-col">
    <div class="bg-orange-500 flex flex-row">
        <h1 class="p-2 font-bold text-white text-lg">Minion</h1>
        <span class="flex-grow" />
    </div>

    {#await conf}
        <span>Loading</span>
    {:then data}
        {#if data.configured}
            <Chat />
        {:else}
            <Setup />
        {/if}
    {/await}
</div>
