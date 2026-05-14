<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    private function adminOnly(): ?JsonResponse
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }
        return null;
    }

    public function index(): JsonResponse
    {
        if ($err = $this->adminOnly()) return $err;

        return response()->json(
            User::orderBy('name')->get()->map(fn($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'role'       => $u->role,
                'created_at' => $u->created_at->format('d M Y'),
            ])
        );
    }

    public function store(Request $request): JsonResponse
    {
        if ($err = $this->adminOnly()) return $err;

        $data = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'role'     => 'required|in:admin,staff_logistic,staff_design,staff_operasional',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'role'     => $data['role'],
            'password' => Hash::make($data['password']),
        ]);

        return response()->json([
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'created_at' => $user->created_at->format('d M Y'),
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        if ($err = $this->adminOnly()) return $err;

        $data = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email,' . $user->id,
            'role'     => 'required|in:admin,staff_logistic,staff_design,staff_operasional',
            'password' => 'nullable|string|min:6',
        ]);

        $update = [
            'name'  => $data['name'],
            'email' => $data['email'],
            'role'  => $data['role'],
        ];

        if (! empty($data['password'])) {
            $update['password'] = Hash::make($data['password']);
        }

        $user->update($update);

        return response()->json([
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'created_at' => $user->created_at->format('d M Y'),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($err = $this->adminOnly()) return $err;

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User dihapus.']);
    }
}
