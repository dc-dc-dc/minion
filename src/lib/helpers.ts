export type Handlers = Record<string, (message, sender: chrome.runtime.MessageSender) => Promise<any>>;

export function messageHelper(handlers: Handlers) {
    return function (message, sender, sendResponse) {
        if (typeof message !== "object") { return }
        if (!message.type || typeof message.type !== "string" || message.type === "") { return }
        console.log("received", message, !message.type, typeof message.type !== "string", message.type === "");
        let handler = handlers[message.type];
        if (handler == null) { return }
        Promise.resolve(handler(message, sender)).then(sendResponse);
        return true
    }
}