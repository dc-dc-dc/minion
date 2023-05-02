<script type="ts">
    const cmds = {
        read_page: {
            active_tab: true,
            cmd: "page:read",
        },
    };
    type Message = {
        content: string; // content of the messagee
        role: "minion" | "user"; // the role
        syn: boolean; // if true this message wont be sent to LLM backend
        hidden?: boolean; // hidden only from the user but will be sent to LLM
        date: Date; // when the message was created
    };
    function getInitialMessage(): Message {
        return {
            content: "How can I help you?",
            role: "minion",
            syn: true,
            date: new Date(),
        };
    }

    let messages: Message[] = [getInitialMessage()];
    $: visibleMessages = messages.filter((e) => !e.hidden);

    let processing = false;
    let commandRequest = null; //{ name: "read_page" };

    function handleUserInput(e) {
        const formData = new FormData(e.target);
        e.target.reset();
        let input = formData.get("input");
        if (input.toString() == "") return;
        addMessage({
            content: input.toString(),
            role: "user",
            syn: false,
            date: new Date(),
        });
        _apiRequest();
    }

    function _apiRequest() {
        processing = true;
        chrome.runtime.sendMessage(
            {
                type: "bg:user:prompt",
                messages: messages
                    .filter((e) => !e.syn)
                    .map((e) => ({
                        content: e.content,
                        role: e.role == "minion" ? "assistant" : "user",
                    })),
            },
            function (response) {
                processing = false;
                if (response == null) {
                    // something went wrong and needs to try again
                    return addMessage({
                        content: `Something went wrong, please try again`,
                        role: "minion",
                        syn: true,
                        date: new Date(),
                    });
                }
                console.log("response", response);
                if (response.command != null && response.command.name != "") {
                    // command request
                    commandRequest = response.command;
                }
                addMessage({
                    content: response.thoughts?.text,
                    role: "minion",
                    syn: false,
                    date: new Date(),
                });
            }
        );
    }

    function reset() {
        commandRequest = null;
        messages = [getInitialMessage()];
    }

    function addMessage(message: Message) {
        messages = [...messages, message];
    }

    function runCommand() {
        if (commandRequest == null) return;
        let inner = { ...commandRequest };
        commandRequest = null;
        processing = true;
        const cmd = cmds[inner.name];
        if (cmd != null) {
            if (cmd.active_tab) {
                chrome.tabs.query(
                    {
                        active: true,
                        lastFocusedWindow: true,
                    },
                    (tabs) => {
                        if (tabs.length === 0) {
                            processing = false;
                            addMessage({
                                content: `Not sure what tab you are referring to can you refocus on it?`,
                                role: "minion",
                                syn: true,
                                date: new Date(),
                            });
                            commandRequest = inner;
                            return;
                        }
                        chrome.tabs.sendMessage(
                            tabs[0].id,
                            {
                                type: "run:cmd",
                                cmd: cmd.cmd,
                            },
                            function (response) {
                                processing = false;
                                console.log("got response", response);
                                addMessage({
                                    content: response,
                                    role: "minion",
                                    syn: false,
                                    hidden: true,
                                    date: new Date(),
                                });
                                _apiRequest();
                            }
                        );
                    }
                );
            }
        }
        commandRequest = null;
    }

    function cancelCommand() {
        // TODO: send cancel command to bg
        addMessage({
            content: `User denied the use of the command ${commandRequest.name}`,
            role: "minion",
            syn: false,
            date: new Date(),
        });
        commandRequest = null;
        _apiRequest();
    }
</script>

<div class="flex flex-grow flex-col space-y-2 overflow-y-auto p-2">
    {#each visibleMessages as message}
        <div class="flex flex-col">
            <span
                class="rounded-md p-2 text-white {message.role == 'minion'
                    ? 'bg-gray-500'
                    : 'bg-blue-500'}"
            >
                {message.content}
            </span>
            <span
                class="font-bold text-gray-800 text-xs capitalize {message.role ==
                'minion'
                    ? 'text-left'
                    : 'text-right'}"
                >{message.role} - {message.date.toLocaleTimeString()}</span
            >
        </div>
    {/each}
    {#if processing}
        <div
            class="flex flex-row rounded-md p-2 items-start bg-gray-500 text-white"
        >
            <span class="animate-bounce">&#9898;</span>
            <span class="animate-bounce delay-100">&#9898;</span>
            <span class="animate-bounce delay-200">&#9898;</span>
        </div>
    {/if}
    {#if commandRequest != null}
        <div class="flex space-y-2 flex-col w-full items-center">
            <span class="font-bold text-gray-500">
                Minion wants to run the following command
                <span class="underline">
                    {commandRequest.name}
                </span>
            </span>
            <div class="flex w-1/2 justify-center space-x-2 flex-row">
                <button
                    class="p-1 w-1/2 flex-grow rounded-md cursor-pointer bg-blue-500 text-white font-bold"
                    on:click={runCommand}>Allow</button
                >
                <button
                    class="p-1 w-1/2 rounded-md cursor-pointer bg-gray-500 text-white font-bold"
                    on:click={cancelCommand}>Cancel</button
                >
            </div>
        </div>
    {/if}
</div>

<form
    class="flex border-t-2 flex-row w-full"
    on:submit|preventDefault={handleUserInput}
>
    <textarea
        rows="2"
        name="input"
        placeholder="Input..."
        autocomplete="off"
        class="flex-grow select-none p-2"
    />
    <button
        type="submit"
        class="p-2 font-bold cursor-pointer bg-blue-500 text-white"
    >
        Send
    </button>
</form>
