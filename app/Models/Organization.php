<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organization extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'parent_id', 'user_id', 'code'];

    protected static function booted()
    {
        static::creating(function ($organization) {
            if (empty($organization->code)) {
                $organization->code = \Illuminate\Support\Str::random(10);
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(Organization::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Organization::class, 'parent_id');
    }

    public function employees()
    {
        return $this->hasMany(Employee::class, 'organization_id');
    }
}
