<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessWhatsAppMessage;
use App\Models\Kiosk;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class WhatsAppController extends Controller
{
    public function verify(Request $request): Response
    {
        $mode      = $request->query('hub_mode');
        $token     = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode !== 'subscribe') {
            return response('Forbidden', 403);
        }

        $globalToken = Setting::get('wa_verify_token') ?: config('services.whatsapp.verify_token', '');
        if ($token === $globalToken) {
            return response($challenge, 200);
        }

        if (Kiosk::where('aktif', true)->where('wa_verify_token', $token)->exists()) {
            return response($challenge, 200);
        }

        return response('Forbidden', 403);
    }

    public function handle(Request $request): Response
    {
        $payload = $request->input('entry.0.changes.0.value');

        if (! isset($payload['messages'][0])) {
            return response('OK', 200);
        }

        // Resolve kiosk ID synchronously (fast DB lookup), then dispatch async
        $phoneNumberId = $payload['metadata']['phone_number_id'] ?? null;
        $kioskId       = $phoneNumberId
            ? Kiosk::where('wa_phone_number_id', $phoneNumberId)->where('aktif', true)->value('id')
            : null;

        ProcessWhatsAppMessage::dispatch($payload, $kioskId);

        // Return 200 immediately — Meta requires a fast response or it retries
        return response('OK', 200);
    }
}
