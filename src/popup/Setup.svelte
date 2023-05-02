<script type="ts">
    function saveCredentials(e) {
        const data = new FormData(e.target);
        chrome.storage.local.set({
            api_key: data.get("api_key"),
            model: data.get("model"),
        });
    }
</script>

<div class="flex flex-col w-full h-full p-4 bg-orange-500">
    <form on:submit|preventDefault={saveCredentials}>
        <div class="flex flex-col">
            <h1 class="text-white font-bold text-xl my-2">Setup Your Minion</h1>
            <label
                class="mb-2 w-full text-lg font-bold text-white"
                for="api_key">OpenAI API Key</label
            >
            <input class="p-2" type="password" id="api_key" name="api_key" />
        </div>
        <input type="hidden" name="model" value="gpt-3.5-turbo" />
        <button
            class="bg-white mt-4 py-2 px-4 w-full font-bold text-lg text-gray-800 cursor-pointer"
            type="submit">Save</button
        >
    </form>
</div>
