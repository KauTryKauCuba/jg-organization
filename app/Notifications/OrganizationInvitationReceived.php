<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrganizationInvitationReceived extends Notification
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
        $senderName = $this->invitation->sender->name;
        $type = $this->invitation->type === 'parent' ? 'Parent Organization' : 'Subsidiary Organization';
        
        return (new MailMessage)
            ->subject('New Organization Connection Request')
            ->line("You have received a connection request from {$senderName}.")
            ->line("They are requesting to connect as your {$type}.")
            ->action('View Request', url('/organization'))
            ->line('Please log in to accept or decline this request.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'message' => "New connection request from {$this->invitation->sender->name}.",
            'link' => '/organization',
            'invitation_id' => $this->invitation->id,
            'type' => 'invitation_received'
        ];
    }
}
