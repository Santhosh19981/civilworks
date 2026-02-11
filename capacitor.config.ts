import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.civilworks.app',
    appName: 'CivilWorks',
    webDir: 'www',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 0,
            backgroundColor: '#0B2C4D',
            androidSplashResourceName: 'splash',
            androidScaleType: 'CENTER_CROP',
            showSpinner: false,
            androidSpinnerStyle: 'large',
            iosSpinnerStyle: 'small',
            spinnerColor: '#F7931E',
            splashFullScreen: true,
            splashImmersive: true
        }
    }
};

export default config;
