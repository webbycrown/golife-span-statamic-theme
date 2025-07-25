<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Statamic\Facades\Entry;
use Illuminate\Support\Str;

class CommentController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'comment_text' => 'required',
            'post' => 'required',
            'user' => 'required',
        ]);
    
        // Fetch the related entry (e.g., campaign)
        $related = Entry::find($validated['post']);
        $this_nmae = Entry::find($validated['user']);
    
        if (!$related) {
            return response()->json(['message' => 'Related post not found.'], 404);
        }
        if (!$this_nmae) {
            return response()->json(['message' => 'User not found.'], 404);
        }
    
        // Create the comment entry
        $entry = Entry::make()
            ->collection('campaigns_comments')
            ->slug(Str::uuid()->toString())
            ->data([
                'title' => $related->get('title'),
                'comment' => $validated['comment_text'],
                'campaign' => $validated['post'],
                'user' => $validated['user'],
                'dates' => now(),
            ]);
    
        $entry->save();
    
        // Extract user display name (optional: fetch user entry if you want full details)
        $user_name = $this_nmae->get("title");
        $initial = strtoupper(substr($user_name, 0, 1));
    
        return response()->json([
            'message' => 'Comment submitted successfully.',
            'data' => [
                'name' => $user_name,
                'initial' => $initial,
                'comment' => $validated['comment_text'],
                'campaign_id' => $validated['post']
            ]
        ]);
    }
}
