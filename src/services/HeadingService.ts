import React, { useEffect, useState } from 'react';

export class HeadingService {
    private static instance: HeadingService;
    private heading: number | null = null;
    
    private constructor() {
        const handleOrientation = (event: DeviceOrientationEvent) => {
        if (event.alpha !== null) {
            // Alpha represents the compass direction in degrees (0-360)
            const compassHeading = event.alpha;
            this.heading = compassHeading;
        }
        };
    
        if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
        console.error('DeviceOrientationEvent is not supported on this device or browser.');
        }
    }
    
    static getInstance(): HeadingService {
        if (!HeadingService.instance) {
        HeadingService.instance = new HeadingService();
        }
        return HeadingService.instance;
    }
    
    getHeading(): number | null {
        return this.heading;
    }
}

export const headingService = HeadingService.getInstance;