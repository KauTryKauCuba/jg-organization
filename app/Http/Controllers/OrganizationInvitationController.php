<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Notifications\OrganizationConnectionConfirmed;
use App\Notifications\OrganizationInvitationAccepted;
use App\Notifications\OrganizationInvitationReceived;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OrganizationInvitationController extends Controller
{
    public function createLink(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:parent,subsidiary',
            'sender_org_id' => 'required|exists:organizations,id',
        ]);

        $senderOrg = Organization::findOrFail($validated['sender_org_id']);

        // Check permission
        setPermissionsTeamId($senderOrg->id);
        if ($senderOrg->user_id !== $request->user()->id && !$request->user()->can('manage_everything')) {
            abort(403, 'You do not have permission to send invitations for this organization.');
        }

        // Generate signed URL
        // Expiration: 7 days
        $url = URL::temporarySignedRoute(
            'organization.invitation.viewLink',
            now()->addDays(7),
            [
                'sender_org_id' => $senderOrg->id,
                'type' => $validated['type']
            ]
        );

        return response()->json(['url' => $url]);
    }

    public function viewLink(Request $request)
    {
        if (!$request->hasValidSignature()) {
            abort(403, 'Invalid or expired invitation link.');
        }

        $senderOrgId = $request->query('sender_org_id');
        $type = $request->query('type');
        
        $senderOrg = Organization::findOrFail($senderOrgId);
        
        // Get user's organizations to choose from
        // We assume the user has a relationship 'organizations' or similar
        // If using Jetstream/Teams, it might be $request->user()->allTeams()
        // Here we see 'ensure.organization' middleware, suggesting standard single/multi org setup.
        // Let's assume Organization model has a user_id or many-to-many.
        // Based on `store` method: $senderOrg->user_id check implies ownership.
        // Let's fetch organizations owned by user for now.
        $userOrgs = Organization::where('user_id', $request->user()->id)->get();
        
        // If user has no organizations, store the current URL in session so they can be redirected back after onboarding
        if ($userOrgs->isEmpty()) {
            session()->put('pending_invitation_url', $request->fullUrl());
        }

        return Inertia::render('invitation/accept', [
            'senderOrg' => $senderOrg,
            'type' => $type,
            'userOrgs' => $userOrgs,
            'signature' => $request->query('signature'), // Pass signature to include in form submission if needed, or rely on query param in action
            'expires' => $request->query('expires')
        ]);
    }

    public function acceptLink(Request $request)
    {
        // We must validate the signature again to ensure the parameters haven't been tampered with
        // The URL parameters (sender_org_id, type) must match the signature.
        // So the form action must include them.
        
        // However, if we put them in the body, `hasValidSignature` checks query string by default.
        // So the form should POST to the full signed URL.
        
        if (!$request->hasValidSignature()) {
             abort(403, 'Invalid or expired invitation link.');
        }

        $validated = $request->validate([
            'receiver_org_id' => 'required|exists:organizations,id',
        ]);

        $senderOrgId = $request->query('sender_org_id');
        $type = $request->query('type');
        
        $senderOrg = Organization::findOrFail($senderOrgId);
        $receiverOrg = Organization::findOrFail($validated['receiver_org_id']);

        // Prevent self-invite
        if ($senderOrg->id === $receiverOrg->id) {
            return back()->with('error', 'You cannot connect to your own organization.');
        }

        // Validation Logic (Same as store)
        // ... (We should extract this, but for now duplicate for safety)
        
        if ($type === 'parent') {
            if ($senderOrg->parent_id) {
                return back()->with('error', 'The sender organization already has a parent.');
            }
            if ($senderOrg->children()->where('id', $receiverOrg->id)->exists()) {
                 return back()->with('error', 'Your organization is already a subsidiary of the sender.');
            }
        }
        
        if ($type === 'subsidiary') {
            if ($receiverOrg->parent_id) {
                 return back()->with('error', 'Your organization already has a parent.');
            }
            if ($receiverOrg->id === $senderOrg->parent_id) {
                 return back()->with('error', 'Your organization is currently the parent of the sender.');
            }
        }

        // Check if invitation already exists
        $existing = OrganizationInvitation::where('sender_org_id', $senderOrg->id)
            ->where('receiver_org_id', $receiverOrg->id)
            ->whereIn('status', ['pending', 'accepted'])
            ->first();

        if ($existing) {
             return back()->with('error', 'An invitation already exists between these organizations.');
        }

        // Create Accepted Invitation
        $invitation = OrganizationInvitation::create([
            'sender_org_id' => $senderOrg->id,
            'receiver_org_id' => $receiverOrg->id,
            'type' => $type,
            'status' => 'accepted', // Auto-accepted by receiver
        ]);

        // Notify Sender that Receiver accepted (So Sender can confirm)
        $senderOrg->user->notify(new OrganizationInvitationAccepted($invitation));

        return redirect()->route('dashboard')->with('success', 'Invitation accepted. Waiting for sender confirmation.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|exists:organizations,code',
            'type' => 'required|in:parent,subsidiary',
            'organization_id' => 'required|exists:organizations,id',
        ]);

        $senderOrg = Organization::findOrFail($validated['organization_id']);
        
        // Check permission
        setPermissionsTeamId($senderOrg->id);
        // Allow if user has permission OR is the owner of the organization
        if ($senderOrg->user_id !== $request->user()->id && !$request->user()->can('manage_everything')) {
             abort(403, 'You do not have permission to send invitations for this organization.');
        }

        $receiverOrg = Organization::where('code', $validated['code'])->firstOrFail();

        // Prevent self-invite
        if ($senderOrg->id === $receiverOrg->id) {
            throw ValidationException::withMessages([
                'code' => 'You cannot invite your own organization.',
            ]);
        }

        // Check if request already exists
        $existing = OrganizationInvitation::where('sender_org_id', $senderOrg->id)
            ->where('receiver_org_id', $receiverOrg->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'code' => 'A pending invitation already exists for this organization.',
            ]);
        }

        // Logic check:
        // If I (Sender) want Receiver to be my PARENT:
        // - I must not already have a parent (unless replacing?). Let's assume strict hierarchy for now: one parent.
        // - Receiver must not be my child (circular dependency).
        if ($validated['type'] === 'parent') {
            if ($senderOrg->parent_id) {
                throw ValidationException::withMessages([
                    'type' => 'This organization already has a parent.',
                ]);
            }
            // Circular check: is Receiver a child of Sender?
            // Simple check for direct child. Deep check might be needed for full robustness, but let's start simple.
            if ($senderOrg->children()->where('id', $receiverOrg->id)->exists()) {
                throw ValidationException::withMessages([
                    'code' => 'The target organization is already a subsidiary of this organization.',
                ]);
            }
        }
        // If I (Sender) want Receiver to be my SUBSIDIARY:
        // - Receiver must not already have a parent.
        // - Receiver must not be my parent.
        if ($validated['type'] === 'subsidiary') {
            // Note: If I invite someone to be my subsidiary, THEY must not already have a parent.
            if ($receiverOrg->parent_id) {
                 throw ValidationException::withMessages([
                    'code' => 'The target organization already has a parent.',
                ]);
            }
             if ($receiverOrg->id === $senderOrg->parent_id) {
                throw ValidationException::withMessages([
                    'code' => 'The target organization is currently your parent.',
                ]);
            }
        }

        $invitation = OrganizationInvitation::create([
            'sender_org_id' => $senderOrg->id,
            'receiver_org_id' => $receiverOrg->id,
            'type' => $validated['type'],
            'status' => 'pending',
        ]);

        $receiverOrg->user->notify(new OrganizationInvitationReceived($invitation));

        return back()->with('success', 'Invitation sent successfully.');
    }

    public function update(Request $request, OrganizationInvitation $invitation)
    {
        $validated = $request->validate([
            'status' => 'required|in:accepted,declined,confirmed',
        ]);

        $user = $request->user();
        
        // Logic for 'accepted' or 'declined' (Receiver Action)
        if (in_array($validated['status'], ['accepted', 'declined'])) {
            // Check permission for Receiver Org
            setPermissionsTeamId($invitation->receiver_org_id);
            if ($invitation->receiver->user_id !== $user->id && !$user->can('manage_everything')) {
                abort(403, 'Unauthorized action.');
            }
            
            // Ensure the invitation is still pending
            if ($invitation->status !== 'pending') {
                return back()->with('error', 'This invitation has already been processed.');
            }

            $invitation->update(['status' => $validated['status']]);

            if ($validated['status'] === 'accepted') {
                $invitation->sender->user->notify(new OrganizationInvitationAccepted($invitation));
            }
            
            return back()->with('success', 'Invitation ' . $validated['status'] . '.');
        }

        // Logic for 'confirmed' (Sender Action)
        if ($validated['status'] === 'confirmed') {
            // Check permission for Sender Org
            setPermissionsTeamId($invitation->sender_org_id);
            if ($invitation->sender->user_id !== $user->id && !$user->can('manage_everything')) {
                abort(403, 'Unauthorized action.');
            }

            // Ensure the invitation is accepted
            if ($invitation->status !== 'accepted') {
                return back()->with('error', 'This invitation cannot be confirmed.');
            }

            // Perform the relationship update (Handshake complete)
            $sender = Organization::find($invitation->sender_org_id);
            $receiver = Organization::find($invitation->receiver_org_id);

            if ($invitation->type === 'parent') {
                // Sender (Requester) wanted Receiver to be their Parent.
                // Receiver Accepted. Sender Confirms.
                // So Sender becomes Child of Receiver.
                $sender->parent_id = $receiver->id;
                $sender->save();
            } elseif ($invitation->type === 'subsidiary') {
                // Sender (Requester) wanted Receiver to be their Subsidiary.
                // Receiver Accepted. Sender Confirms.
                // So Receiver becomes Child of Sender.
                $receiver->parent_id = $sender->id;
                $receiver->save();
            }

            $invitation->update(['status' => 'confirmed']);

            $receiver->user->notify(new OrganizationConnectionConfirmed($invitation));

            return back()->with('success', 'Connection confirmed successfully.');
        }
    }

    public function destroy(OrganizationInvitation $invitation)
    {
        $invitation->delete();
        return back()->with('success', 'Invitation cancelled.');
    }
}
