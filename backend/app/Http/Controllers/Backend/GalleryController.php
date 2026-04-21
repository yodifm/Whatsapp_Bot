<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Gallery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GalleryController extends Controller
{
    public function index(): JsonResponse
    {
        $galleries = Gallery::orderBy('urutan')->orderBy('id')->get()
            ->map(fn($g) => array_merge($g->toArray(), [
                'url'           => $g->url,
                'thumbnail_url' => $g->thumbnail_url,
            ]));

        return response()->json($galleries);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'foto'      => 'required|image|max:5120',
            'judul'     => 'required|string|max:255',
            'kategori'  => 'in:wedding,birthday,corporate,other',
            'deskripsi' => 'nullable|string',
            'urutan'    => 'nullable|integer|min:0',
        ]);

        $path = $request->file('foto')->store('gallery', 'public');

        $gallery = Gallery::create([
            'judul'     => $request->judul,
            'file_path' => $path,
            'kategori'  => $request->kategori ?? 'other',
            'deskripsi' => $request->deskripsi,
            'urutan'    => $request->urutan ?? 0,
            'aktif'     => true,
        ]);

        return response()->json(array_merge($gallery->toArray(), [
            'url'           => $gallery->url,
            'thumbnail_url' => $gallery->thumbnail_url,
        ]), 201);
    }

    public function update(Request $request, Gallery $gallery): JsonResponse
    {
        $request->validate([
            'judul'     => 'sometimes|string|max:255',
            'kategori'  => 'in:wedding,birthday,corporate,other',
            'deskripsi' => 'nullable|string',
            'urutan'    => 'nullable|integer|min:0',
            'aktif'     => 'boolean',
        ]);

        $gallery->update($request->only(['judul', 'kategori', 'deskripsi', 'urutan', 'aktif']));

        return response()->json(array_merge($gallery->fresh()->toArray(), [
            'url'           => $gallery->url,
            'thumbnail_url' => $gallery->thumbnail_url,
        ]));
    }

    public function destroy(Gallery $gallery): JsonResponse
    {
        Storage::disk('public')->delete($gallery->file_path);
        if ($gallery->thumbnail_path) {
            Storage::disk('public')->delete($gallery->thumbnail_path);
        }
        $gallery->delete();

        return response()->json(['message' => 'Foto dihapus']);
    }
}
