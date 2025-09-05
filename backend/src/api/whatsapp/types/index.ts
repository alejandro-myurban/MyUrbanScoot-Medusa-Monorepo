export type TwilioWebhookBody = {
    Body: string;
    From: string;
    NumMedia?: string;
    MediaUrl0?: string;
    ProfileName?: string;
};

export interface ProcessingState {
    isProcessing: boolean;
    threadId?: string;
}
