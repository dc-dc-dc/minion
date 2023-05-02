import { messageHelper, type Handlers } from "../lib/helpers";

const handlers: Handlers = {
    "page:read": async (message, sender) => {
        const body = document.querySelector("body");
        const titleNode = document.querySelector("title");
        const descNode = document.querySelector("meta[name='description']") as HTMLMetaElement;
        // TODO: Check if not set and look for other similar element
        return `Metadata about the page below.
        Title: ${titleNode.innerText}
        Description: ${descNode?.content}
        The content of the page is below:
        ${body.innerText}`;
    }
};

chrome.runtime.onMessage.addListener(messageHelper(handlers));