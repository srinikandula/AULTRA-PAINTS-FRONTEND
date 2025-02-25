import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';


import {routes} from './app.routes';
import {provideClientHydration} from '@angular/platform-browser';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {JwtInterceptor} from "./interceptor/token.interceptor";
import {CatchErrorInterceptor} from "./interceptor/http-error.interceptor";
import {LoaderInterceptor} from "./interceptor/loader.interceptor";


export const appConfig: ApplicationConfig = {
    providers: [provideZoneChangeDetection({eventCoalescing: true}), provideRouter(routes), provideHttpClient(), provideClientHydration(), provideAnimationsAsync(),
        provideHttpClient(withInterceptorsFromDi()), // Enable interceptors from DI

        {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true},
        {provide: HTTP_INTERCEPTORS, useClass: CatchErrorInterceptor, multi: true},
        {provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true},
    ]
};
