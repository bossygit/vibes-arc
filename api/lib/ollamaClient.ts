export interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface OllamaCallOptions {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
}

export async function callOllama(
    messages: OllamaChatMessage[],
    opts: OllamaCallOptions = {}
): Promise<string> {
    const apiKey = process.env.OLLAMA_API_KEY;
    if (!apiKey) throw new Error('OLLAMA_API_KEY non configurée');

    const url = process.env.OLLAMA_API_URL ?? 'https://ollama.com/api/chat';
    const model = process.env.OLLAMA_MODEL ?? 'gemma4:31b-cloud';

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            stream: false,
            options: {
                temperature: opts.temperature ?? 0.7,
                top_p: opts.top_p ?? 0.9,
                num_predict: opts.num_predict ?? 1024,
            },
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error('Ollama error:', res.status, errorText);
        throw new Error(`Ollama API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data?.message?.content;
    if (!text) throw new Error('Réponse Ollama vide');
    return text;
}
