<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessWhatsAppMessage;
use App\Models\Kiosk;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class WhatsAppController extends Controller
{
    // Meta webhook verification (kept for compatibility)
    public function verify(Request $request): Response
    {
        $challenge = $request->query('hub_challenge');
        $token     = $request->query('hub_verify_token');
        $verifyToken = \App\Models\Setting::get('wa_verify_token')
            ?: config('services.whatsapp.verify_token', '');

        if ($request->query('hub_mode') === 'subscribe' && $token === $verifyToken) {
            return response($challenge, 200);
        }

        return response('Forbidden', 403);
    }

    // Fonnte webhook handler
    public function handle(Request $request): Response
    {
        $data = $request->all();

        // Fonnte sends: sender, message, device, name, file, filetype
        if (isset($data['sender'])) {
            $this->handleFonnte($data);
            return response('OK', 200);
        }

        // Meta fallback format
        $payload = $request->input('entry.0.changes.0.value');
        if (isset($payload['messages'][0])) {
            $phoneNumberId = $payload['metadata']['phone_number_id'] ?? null;
            $kioskId       = $phoneNumberId
                ? Kiosk::where('wa_phone_number_id', $phoneNumberId)->where('aktif', true)->value('id')
                : null;
            ProcessWhatsAppMessage::dispatch($payload, $kioskId);
        }

        return response('OK', 200);
    }

    private function handleFonnte(array $data): void
    {
        $sender   = $data['sender']   ?? null;
        $message  = $data['message']  ?? '';
        $device   = $data['device']   ?? null;
        $name     = $data['name']     ?? null;
        $file     = $data['file']     ?? null;
        $filetype = $data['filetype'] ?? null;

        if (! $sender) return;

        // Resolve kiosk by device phone number
        $kioskId = $device
            ? Kiosk::where('aktif', true)
                ->where(function ($q) use ($device) {
                    // Match by phone number stored in wa_phone_number_id field
                    $clean = preg_replace('/\D/', '', $device);
                    $q->where('wa_phone_number_id', $device)
                      ->orWhere('wa_phone_number_id', $clean);
                })->value('id')
            : null;

        // Normalize to internal format
        $isImage  = $file && str_starts_with((string) $filetype, 'image');
        $payload  = [
            'provider' => 'fonnte',
            'messages' => [[
                'from'    => $sender,
                'type'    => $isImage ? 'image' : 'text',
                'text'    => ['body' => $message],
                'image'   => $isImage ? ['url' => $file, 'caption' => $message, 'id' => null] : null,
            ]],
            'contacts' => [[
                'profile' => ['name' => $name],
            ]],
            'metadata' => [
                'phone_number_id' => $device,
                'provider'        => 'fonnte',
            ],
        ];

        ProcessWhatsAppMessage::dispatch($payload, $kioskId);
    }
}
