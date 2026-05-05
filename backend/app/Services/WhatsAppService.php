<?php

namespace App\Services;

use App\Models\Kiosk;
use App\Models\Setting;
use GuzzleHttp\Client;

class WhatsAppService
{
    private Client $client;
    private string $phoneNumberId;
    private string $accessToken;

    public function __construct()
    {
        $this->phoneNumberId = Setting::get('wa_phone_number_id')
            ?: config('services.whatsapp.phone_number_id', '');

        $this->accessToken = Setting::get('wa_access_token')
            ?: config('services.whatsapp.access_token', '');

        $this->client = new Client([
            'base_uri' => 'https://graph.facebook.com',
            'timeout'  => 15,
        ]);
    }

    public static function forKiosk(Kiosk $kiosk): self
    {
        $instance = new self();
        $instance->phoneNumberId = $kiosk->wa_phone_number_id;
        $instance->accessToken   = $kiosk->wa_access_token;
        return $instance;
    }

    public function sendText(string $to, string $message): void
    {
        $this->client->post("/v19.0/{$this->phoneNumberId}/messages", [
            'headers' => [
                'Authorization' => "Bearer {$this->accessToken}",
                'Content-Type'  => 'application/json',
            ],
            'json' => [
                'messaging_product' => 'whatsapp',
                'to'                => $to,
                'type'              => 'text',
                'text'              => ['body' => $message],
            ],
        ]);
    }

    public function sendImage(string $to, string $imageUrl, string $caption = ''): void
    {
        $this->client->post("/v19.0/{$this->phoneNumberId}/messages", [
            'headers' => [
                'Authorization' => "Bearer {$this->accessToken}",
                'Content-Type'  => 'application/json',
            ],
            'json' => [
                'messaging_product' => 'whatsapp',
                'to'                => $to,
                'type'              => 'image',
                'image'             => [
                    'link'    => $imageUrl,
                    'caption' => $caption,
                ],
            ],
        ]);
    }

    /**
     * Upload a local file to WhatsApp media API, then send as a document message.
     */
    public function sendDocument(string $to, string $filePath, string $filename, string $caption = ''): void
    {
        // Step 1: Upload file to WhatsApp media
        $mediaId = $this->uploadMedia($filePath, 'application/pdf');

        // Step 2: Send document by media_id
        $this->client->post("/v19.0/{$this->phoneNumberId}/messages", [
            'headers' => [
                'Authorization' => "Bearer {$this->accessToken}",
                'Content-Type'  => 'application/json',
            ],
            'json' => [
                'messaging_product' => 'whatsapp',
                'to'                => $to,
                'type'              => 'document',
                'document'          => [
                    'id'       => $mediaId,
                    'filename' => $filename,
                    'caption'  => $caption,
                ],
            ],
        ]);
    }

    private function uploadMedia(string $filePath, string $mimeType): string
    {
        $response = $this->client->post("/v19.0/{$this->phoneNumberId}/media", [
            'headers' => [
                'Authorization' => "Bearer {$this->accessToken}",
            ],
            'multipart' => [
                [
                    'name'     => 'file',
                    'contents' => fopen($filePath, 'r'),
                    'filename' => basename($filePath),
                    'headers'  => ['Content-Type' => $mimeType],
                ],
                ['name' => 'messaging_product', 'contents' => 'whatsapp'],
                ['name' => 'type',               'contents' => $mimeType],
            ],
        ]);

        $data = json_decode($response->getBody()->getContents(), true);

        return $data['id'];
    }
}
