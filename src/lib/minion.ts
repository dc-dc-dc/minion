type InitData = { configured: boolean, api_key?: string; model?: string };

export async function loadKeyModel(): Promise<InitData> {
    const data = await chrome.storage.local.get(["api_key", "model"]);
    if (
        !data.api_key ||
        !data.model ||
        typeof data.api_key !== "string" ||
        typeof data.model !== "string"
    ) {
        return {
            configured: false,
        };
    }
    return { configured: true, ...data } as InitData;
}

export class Minion {
    constructor(
        private _systemPrompt: string,
        private _apiKey: string,
        private _model: string,
        private _history: Message[]) { }

    async next() {
        const messages: Message[] = [{ role: "system", content: this._systemPrompt }];
        // this._history.unshift({ role: "user", content: content });
        for (const message of this._history) {
            messages.push(message);
        }
        const response = await openAiRequest(this._apiKey, this._model, messages)
        this._history.unshift({ role: "assistant", content: JSON.stringify(response) });
        return response
    }
}

export async function init(initial_goal: string) {
    // check to see if the minion is configured
    const { configured, api_key, model } = await loadKeyModel();
    if (!configured) {
        return "not configured";
    }
}

export function getSystemPrompt(goal: string, extra: string): string {
    const constraints = [
        "4000 word limit for short term memory, save important information to memory",
        "no user assitance",
        "only use the commands listed in double quotes eg \"command name\"",
        "use subprocess for commands that take a long time",
    ]
    const resources = [
        "read content from the website the user is on",
        "read email thread"
    ];
    const commands: Command[] = [
        {
            label: "read from website",
            name: "read_page",
        },
        {
            label: "read email thread from page",
            name: "read_email",
        },
        {
            label: "when the goal has been accomplished",
            name: "finished",
        }
    ];
    return systemPrompt(goal, extra, resources, commands, constraints);
}

type Command = { label: string, name: string, args?: Record<string, any> };

function systemPrompt(goal: string, extra: string, resources: string[], commands: Command[], constraints: string[]): string {
    return `Your decisions must always be made independently without seeking user assitance. 
            Use simple strategies with no legal consequences. Your name is minion and you are a browser extension. 
            ${extra}
            The user wants you to accomplish the following goal: 
            ${goal}
            
            Constraints:
            ${constraints.join("\n")}
            Commands:
            ${commands.map(command => `${command.label} : ${command.name}, ${command.args != null && `args: ${Object.entries(command.args).map((k, v) => `"${k}":"${v}"`)}`}`).join("\n")} 
            Resources:
            ${resources.join("\n")}
            
            Only respond in valid JSON format as described below:
            {"thoughts": {"text": "thought", "reasoning": "reasoning", "plan": "- short bulleted list that conveys a long term plan", "criticism": "constructive self-criticism"}, "command": {"name": "command name", "args": { "arg name": "value" }}}
            `
}

type Message = { role: string, content: string };

export async function openAiRequest(api_key: string, model: string, messages: Message[]) {
    let attempts = 0;
    let data = null;
    while (attempts < 3 && data == null) {
        console.log(`attempt ${attempts} data ${data}`)
        data = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${api_key}`,
            },
            body: JSON.stringify({
                model: model,
                messages: messages
            }),
        }).then(res => {
            if (res.status !== 200) {
                throw new Error("OpenAI request failed");
            }
            return res.json();
        }).then(t => {
            // try to extract valid json from the response
            const content = t.choices[0].message.content;
            const json = content.match(/\{.*\}/);
            console.log(`DEBUG: ${json}`);
            if (json == null) {
                throw new Error("OpenAI response is not valid JSON");
            }
            return JSON.parse(json[0].trim());
        }).catch(err => {
            console.error(err);
        })
        attempts += 1;
    }
    return data;
}