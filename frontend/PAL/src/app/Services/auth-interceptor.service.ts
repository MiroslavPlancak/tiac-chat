import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService implements HttpInterceptor {

  constructor(private authService: AuthService) { }

  intercept(request: HttpRequest<any>, handler: HttpHandler): Observable<HttpEvent<any>> {
    
    //do not intercept registration end point
    if (request.url.includes('http://localhost:5008/api/AuthController/register-user')) {
      
      return handler.handle(request);
    }

    //console.log("Interceptor - interceptor request.");
    //console.log(request)
    
    const accessToken = this.authService.getAccessToken();
    
    if (accessToken) {
      request = this.addToken(request, accessToken);
    }

    return handler.handle(request).pipe(
      catchError((error) => {
        console.error("Interception Error: ", error);
        if (error.status === 401 && accessToken) {
          console.log('Interceptor - handling 401 error');
          return this.handle401Error(request, handler, accessToken);
        }
        return throwError(error);
      })
    )
  }

  addToken(request: HttpRequest<any>, accessToken: string): HttpRequest<any> {
   
    const requestWithTokenAttached = request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
   
    return requestWithTokenAttached
  }


  handle401Error(request: HttpRequest<any>, next: HttpHandler, accessToken: string): Observable<HttpEvent<any>> {
   
    const refreshToken = this.authService.getRefreshToken();
    console.log(refreshToken)
    
    if (!refreshToken) {
      this.authService.logout();
      return throwError("No refresh token available.");
    }

    return this.authService.refreshTokens(accessToken, refreshToken).pipe(
      switchMap((response) => {
        if (response.accessToken) {
          request = this.addToken(request, response.accessToken);
          return next.handle(request);
        } else {
          this.authService.logout();
          return throwError("token refresh failed");
        }

      }),
      catchError((error) => {
        this.authService.logout();
        return throwError(error);
      }));

  }


}

