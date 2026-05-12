<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationInvitation extends Model
{
    protected $fillable = ['sender_org_id', 'receiver_org_id', 'type', 'status'];

    public function sender()
    {
        return $this->belongsTo(Organization::class, 'sender_org_id');
    }

    public function receiver()
    {
        return $this->belongsTo(Organization::class, 'receiver_org_id');
    }
}
