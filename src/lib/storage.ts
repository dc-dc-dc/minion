export default {
    getSecure: (keys: string) => chrome.storage.session.get(keys),
    setSecure: (data: Record<string, any>) => chrome.storage.session.set(data),
}