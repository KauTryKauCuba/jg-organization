<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrganizationConnectionConfirmed extends Notification
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
        
        return (new MailMessage)
            ->subject('Organization Connection Confirmed')
            ->line("The connection with {$senderName} has been confirmed.")
            ->action('View Organization', url('/organization'))
            ->line('You are now connected.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'message' => "Connection with {$this->invitation->sender->name} confirmed.",
            'link' => '/organization',
            'invitation_id' => $this->invitation->id,
            'type' => 'connection_confirmed'
        ];
    }
}
