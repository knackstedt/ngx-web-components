import { HttpClient, HttpContext, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable, Pipe, PipeTransform, isDevMode } from '@angular/core';
import { retry, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export type FetchOptions = {
    headers?: HttpHeaders | {
        [header: string]: string | string[];
    };
    context?: HttpContext;
    params?: HttpParams | {
        [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
    };
    body?: any,
    observe?: 'body' | 'events' | 'response';
    reportProgress?: boolean;
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
    withCredentials?: boolean;
};

@Injectable({
    providedIn: "root"
})
export class Fetch {
    constructor(private http: HttpClient) { }

    // Public interface for making AJAX transactions
    public get<T>(url: string, options: FetchOptions = {}, returnError = false): Promise<T> {
        return this.request<T>("get", url, options, returnError);
    }
    public put<T>(url: string, body: any, options: FetchOptions = {}, returnError = false): Promise<T> {
        options.body = (options.body && Object.keys(options.body).length > 0 ? options.body : body) || {};
        return this.request<T>("put", url, options, returnError);
    }
    public post<T>(url: string, body: any, options: FetchOptions = {}, returnError = false): Promise<T> {
        options.body = (options.body && Object.keys(options.body).length > 0 ? options.body : body) || {};
        return this.request<T>("post", url, options, returnError);
    }
    public patch<T>(url: string, body: any, options: FetchOptions = {}, returnError = false): Promise<T> {
        options.body = (options.body && Object.keys(options.body).length > 0 ? options.body : body) || {};
        return this.request<T>("patch", url, options, returnError);
    }
    public delete<T>(url: string, options: FetchOptions = {}, returnError = false): Promise<T> {
        return this.request<T>("delete", url, options, returnError);
    }

    // Internally, handle the observable as a promise.
    private request<T>(method: string, url: string, options: FetchOptions = {}, returnError = false): Promise<T> {
        options.reportProgress = true;

        // Allow support for different response types.
        // Generally we shouldn't need this to be anything other than JSON.
        options.responseType = options.responseType || "json";
        options.withCredentials = true;

        if (!url || url.length < 3)
            throw new Error("Cannot " + method + " on URL [" + url + "]");

        const p = new Promise((resolve, reject) => {
            const o = this.http.request(method, url, options)
                .pipe(retry({
                    delay(error, retryCount) {
                        if (error.status == 429 || error.status == 502)
                            return of({});

                        if (error.status == 504 && isDevMode())
                            alert("Connect to the Azure VPN");

                        throw error;
                    },
                    count: 2
                }), catchError(err => {
                    if (returnError)
                        reject(err);

                    const title = err.error?.title || "Backend failure";
                    const msg = err.error?.message ||
                        (!!(err.errors || [])[0] && JSON.stringify(err.errors[0])) ||
                        err.error?.error ||
                        (typeof err.error == 'string' && /^[^<]/.test(err.error) && err.error) ||
                        err.body ||
                        err.message ||
                        err.title;

                    return of(null);
                }))
                .subscribe(data => {

                    if (Array.isArray(data)) {
                        for (let i = 0; i < data.length; i++) {
                            let item = data[i];
                            Object.keys(item).forEach(k => {
                                if (typeof item[k] == 'object' && Object.keys(item[k]).length == 0)
                                    delete item[k];
                            });
                        }
                    }

                    resolve(data as unknown as T);
                    // Release object
                    if (typeof o != "undefined")
                        o.unsubscribe();
                });
        });

        return p as Promise<T>;
    }
}


@Pipe({
    name: 'urlSanitizer',
    standalone: true
})
export class UrlSanitizer implements PipeTransform {

    constructor(private sanitizer: DomSanitizer) { }

    public transform(url: string): SafeUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}
