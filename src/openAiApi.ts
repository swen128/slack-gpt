import axios, { AxiosInstance } from "axios";

type Model = "gpt-4" | "gpt-4-0314" | "gpt-4-32k" | "gpt-4-32k-0314" | "gpt-3.5-turbo" | "gpt-3.5-turbo-0301";
type Role = "system" | "user" | "assistant";

interface Message {
    role: Role;
    content: string;
}

export interface ChatCompletionOptions {
    model: Model;
    messages: Message[];
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    stop?: string | string[];
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    logit_bias?: Record<string, number>;
    user?: string;
}

export interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    choices: {
        index: number;
        message: {
            role: Role;
            content: string;
        };
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export class OpenAIClient {
    private apiClient: AxiosInstance;

    constructor(apiKey: string) {
        this.apiClient = axios.create({
            baseURL: "https://api.openai.com/v1",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
        });
    }

    async createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
        const response = await this.apiClient.post<ChatCompletionResponse>("/chat/completions", options);
        return response.data;
    }
}
