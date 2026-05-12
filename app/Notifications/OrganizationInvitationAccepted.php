<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrganizationInvitationAccepted extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $invitation)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $receiverName = $this->invitation->receiver->name;
        
        return (new MailMessage)
            ->subject('Organization Invitation Accepted')
            ->line("{$receiverName} has accepted your connection request.")
            ->action('Confirm Connection', url('/organization'))
            ->line('Please log in to confirm and finalize the connection.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'message' => "{$this->invitation->receiver->name} accepted your invitation. Confirm to connect.",
            'link' => '/organization',
            'invitation_id' => $this->invitation->id,
            'type' => 'invitation_accepted'
        ];
    }
}
