<?php

namespace App\Services;

use GuzzleHttp\Client;
use Throwable;

class DistanceService
{
    // Office: Harapan Indah, Bekasi Utara
    private const OFFICE_LAT  = -6.2152;
    private const OFFICE_LNG  = 107.0248;
    private const FREE_KM     = 60;
    private const ROAD_FACTOR = 1.3; // straight-line to estimated driving distance

    /**
     * Calculate driving distance estimate from office to a venue.
     * Returns null if geocoding fails (Nominatim down or venue not found).
     *
     * @return array{km: float, gratis: bool}|null
     */
    public function calculate(string $venue): ?array
    {
        if (empty(trim($venue))) return null;

        $coords = $this->geocode($venue);
        if (! $coords) return null;

        $straight  = $this->haversine(self::OFFICE_LAT, self::OFFICE_LNG, $coords['lat'], $coords['lng']);
        $estimated = round($straight * self::ROAD_FACTOR, 1);

        return [
            'km'     => $estimated,
            'gratis' => $estimated < self::FREE_KM,
        ];
    }

    /**
     * Geocode a venue name to lat/lng using OpenStreetMap Nominatim (free, no key).
     */
    private function geocode(string $address): ?array
    {
        try {
            $client   = new Client(['timeout' => 8]);
            $response = $client->get('https://nominatim.openstreetmap.org/search', [
                'query' => [
                    'q'               => $address . ', Indonesia',
                    'format'          => 'json',
                    'limit'           => 1,
                    'accept-language' => 'id',
                ],
                'headers' => [
                    'User-Agent' => 'WaktubiyaPhotobooth/1.0 (booking-distance)',
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            if (empty($data)) return null;

            return [
                'lat' => (float) $data[0]['lat'],
                'lng' => (float) $data[0]['lon'],
            ];
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Haversine formula — returns straight-line distance in km.
     */
    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R    = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a    = sin($dLat / 2) ** 2
              + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
