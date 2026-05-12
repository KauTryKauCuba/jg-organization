import type { HTMLAttributes } from 'react';

export default function AppLogoIcon(props: HTMLAttributes<HTMLVideoElement>) {
    return (
        <video
            {...props}
            src="/images/Meditating%20Brain.webm"
            autoPlay
            loop
            muted
            playsInline
            className={`object-contain ${props.className || ''}`}
        />
    );
}
