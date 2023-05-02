import { messageHelper, type Handlers } from "../lib/helpers";
import { Minion, getSystemPrompt, loadKeyModel } from "../lib/minion";

async function getCurrentTab() {
    return chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    })
}

const handlers: Handlers = {
    "bg:user:prompt": async (message, sender) => {
        const { api_key, model } = await loadKeyModel();
        // this should be the first user message
        let initial_goal = "";
        const tabs = await getCurrentTab();
        let extraInfo = '';
        if (tabs.length > 0) {
            extraInfo = `User is on a page with the url of: "${tabs[0].url}" with a title of "${tabs[0].title}`
        }
        for (const m of message.messages) {
            if (m.role === "user") {
                initial_goal = m.content;
                break
            }
        }

        const minion = new Minion(getSystemPrompt(initial_goal, extraInfo), api_key, model, message.messages);
        const res = await minion.next();
        return res
    }
}

chrome.runtime.onMessage.addListener(messageHelper(handlers));