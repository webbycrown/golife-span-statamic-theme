<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Statamic\Facades\Entry;
use Statamic\Facades\AssetContainer;
use Statamic\Facades\Asset;

class CustomerController extends Controller
{

    public function update(Request $request)
    {
        // Validate incoming fields
        $validator = Validator::make($request->all(), [
            'id' => 'required|string',
            'mobile' => 'required|string|min:10|max:10',
            'gender' => 'required|string',
            'occupation' => 'required|string',
            'education' => 'required|string',
            'pan' => 'nullable|string|max:10',
            'aadhaar' => 'nullable|string|min:12|max:12',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Find customer entry
        $entry = Entry::find($request->input('id'));

        if (!$entry) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found.'
            ], 404);
        }

        // Update fields
        $entry
            ->set('mobile_number', $request->input('mobile'))
            ->set('gender', $request->input('gender'))
            ->set('occupation', $request->input('occupation'))
            ->set('education', $request->input('education'))
            ->set('pan_card_number', $request->input('pan'))
            ->set('adharcard_number', $request->input('aadhaar'))
            ->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully!'
        ]);
    }

    public function updateImage(Request $request)
    {
        $entry = Entry::find($request->input('id'));

        if (!$entry) {
            return response()->json(['error' => 'Entry not found'], 404);
        }

        if ($request->hasFile('profile_image')) {
            $image = $request->file('profile_image');
            $container = AssetContainer::find('assets');
            $disk = $container->disk();

            // ✅ Delete only this entry's existing image
            $existing = $entry->get('profile_image');
            $oldPath = null;

            if (is_array($existing)) {
                $oldPath = $existing[0] ?? null;
            } elseif (is_string($existing)) {
                $oldPath = $existing;
            }

            if (!empty($oldPath) && $disk->exists($oldPath)) {
                $disk->delete($oldPath);
            }

            // ✅ Upload new image
            $path = $image->store('profile-images', $container->diskHandle());
            $assetPath = 'profile-images/' . basename(path: $path);

            // ✅ Save to entry
            $entry->set('profile_image', [$assetPath])->save();

            return response()->json([
                'success' => true,
                'url' => $disk->url($assetPath),
            ]);
        }

        return response()->json(['error' => 'No image uploaded'], 400);
    }
}
