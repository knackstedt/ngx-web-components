import { Injectable } from "@angular/core";
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from "@angular/common/http";
import { retry, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export type HttpOptions = {
    body?: any;
    headers?: HttpHeaders | {
        [header: string]: string | string[];
    };
    context?: HttpContext;
    params?: HttpParams | {
        [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
    };
    observe?: 'body' | 'events' | 'response';
    reportProgress?: boolean;
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
    withCredentials?: boolean;
}

@Injectable({
    providedIn: "root"
})
export class Fetch {
    constructor(private http: HttpClient) { }

    // Public interface for making AJAX transactions
    public get<T>(url: string, options: HttpOptions = {}): Promise<T> {
        return this.request<T>("get", url, options);
    }
    public put<T>(url: string, body: any, options: HttpOptions = {}): Promise<T> {
        options.body = (options.body && Object.keys(options.body).length > 0 ? options.body : body) || {};
        return this.request<T>("put", url, options);
    }
    public post<T>(url: string, body: any, options: HttpOptions = {}): Promise<T> {
        options.body = (options.body && Object.keys(options.body).length > 0 ? options.body : body) || {};
        return this.request<T>("post", url, options);
    }
    public delete<T>(url: string, options: HttpOptions = {}): Promise<T> {
        return this.request<T>("delete", url, options);
    }

    // Internally, handle the observable as a promise.
    private request<T>(method: string, url: string, options): Promise<T> {
        options.reportProgress = true;

        // Allow support for different response types.
        // Generally we shouldn't need this to be anything other than JSON.
        options.responseType = options.responseType || "json";
        options.withCredentials = true;

        const p = new Promise((resolve, reject) => {
            const o = this.http.request(method, url, options)
                .pipe(retry({
                    delay(error, retryCount) {
                        if (error.status == 429 || error.status == 502 || error.status == 504)
                            return of({});
                        throw error;
                    },
                    count: 2
                }), catchError(err => {
                    const title = err.error?.title || err.title;
                    const message = err.error?.message || err.message;

                    return of(null);
                }))
                .subscribe(data => {
                    o.unsubscribe();
                    resolve(data as unknown as T);
                });
        });

        return p as Promise<T>;
    }
}
