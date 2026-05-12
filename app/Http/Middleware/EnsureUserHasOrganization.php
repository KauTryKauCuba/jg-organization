<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class EnsureUserHasOrganization
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && !$request->user()->organizations()->exists()) {
            if ($request->routeIs('onboarding.*') || 
                $request->routeIs('organization.store') || 
                $request->routeIs('organization.restore')) {
                return $next($request);
            }

            return redirect()->route('onboarding.welcome');
        }

        // If user HAS organizations but tries to go to onboarding, redirect to dashboard
        if ($request->user() && $request->user()->organizations()->exists() && $request->routeIs('onboarding.*')) {
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
