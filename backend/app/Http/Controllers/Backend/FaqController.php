<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Faq::orderBy('urutan')->orderBy('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pertanyaan' => 'required|string|max:255',
            'jawaban'    => 'required|string',
            'kategori'   => 'nullable|string|max:100',
            'urutan'     => 'nullable|integer|min:0',
            'aktif'      => 'boolean',
        ]);

        return response()->json(Faq::create($validated), 201);
    }

    public function update(Request $request, Faq $faq): JsonResponse
    {
        $validated = $request->validate([
            'pertanyaan' => 'sometimes|string|max:255',
            'jawaban'    => 'sometimes|string',
            'kategori'   => 'nullable|string|max:100',
            'urutan'     => 'nullable|integer|min:0',
            'aktif'      => 'boolean',
        ]);

        $faq->update($validated);

        return response()->json($faq);
    }

    public function destroy(Faq $faq): JsonResponse
    {
        $faq->delete();
        return response()->json(['message' => 'FAQ dihapus']);
    }
}
