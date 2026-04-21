<?php

namespace App\Services;

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
}
