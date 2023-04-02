import { APIGatewayProxyHandler } from "aws-lambda";
import { App, AwsLambdaReceiver } from "@slack/bolt";
import { ChatCompletionOptions, ChatCompletionResponse, OpenAIClient, } from "./openAiApi";
import { AwsCallback, AwsEvent } from "@slack/bolt/dist/receivers/AwsLambdaReceiver";

const signingSecret = process.env.SLACK_SIGNING_SECRET ?? "";
const botToken = process.env.SLACK_BOT_TOKEN ?? "";
const openaiApiKey = process.env.OPENAI_API_KEY ?? "";

const awsLambdaReceiver = new AwsLambdaReceiver({ signingSecret });
const app = new App({ token: botToken, receiver: awsLambdaReceiver });

const apiClient = new OpenAIClient(openaiApiKey);

app.event("app_mention", async ({ event, context }) => {
    if (event.thread_ts) {
        const thread = await getThreadHistory(event.channel, event.thread_ts);
        const response = await callOpenaiApi(thread);
        await app.client.chat.postMessage({
            token: context.botToken,
            channel: event.channel,
            thread_ts: event.thread_ts,
            text: response,
        });
    }
});

/**
 * Get the thread history from Slack
 * https://api.slack.com/methods/conversations.replies
 * 
 * @param channel 
 * @param thread_ts 
 * @returns 
 */
async function getThreadHistory(channel: string, thread_ts: string) {
    const result = await app.client.conversations.replies({
        token: botToken,
        channel,
        ts: thread_ts,
    });

    return result.messages
        ?.map(message => `${message.user}: ${message.text}`)
        .join("\n")
        ?? "";
}

async function callOpenaiApi(thread: string) {
    const options: ChatCompletionOptions = {
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "You are a helpful Slack bot." },
            { role: "user", content: thread },
        ],
    };

    const response: ChatCompletionResponse = await apiClient.createChatCompletion(options);
    return response.choices[0].message.content.trim();
}

export const handler: APIGatewayProxyHandler = async (event: AwsEvent, context: unknown, callback: AwsCallback) => {
    const handler = await awsLambdaReceiver.start();
    return handler(event, context, callback);
};
