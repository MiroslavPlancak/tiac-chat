import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User, User as any } from './user.service';
import { UserRegister } from '../Components/register-user/register-user.component';
import { NotificationDialogService } from './notification-dialog.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = "http://localhost:5008/api/AuthController/";

 

  
  public userId$ = new BehaviorSubject<number | null>(null);
  public loggedOut$ = new Subject<boolean>();
  // private logoutSubject$ = new Subject<void>();


  constructor(

    private http: HttpClient,
    private router: Router,
    private jwtHelper: JwtHelperService,
   

  ) {
    
    this.userId$.next(this.extractUserId());
  }

  createNewUser(userRegInfo: UserRegister): Observable<UserRegister> {
    const url = `${this.apiUrl}register-user` 
    return this.http.post<UserRegister>(url,userRegInfo)
    
  }


  login(email: string, password: string): Observable<any> {
    const loginBody = { email, password };
    return this.http.post<any>(`${this.apiUrl}authenticate-user`, loginBody).pipe(
      tap(response => {
        this.storeTokens(response);
        this.userId$.next(this.extractUserId());
        setTimeout(() => this.router.navigate(['/chatMat']), 100);
      })
    );
  }


  //promeniti u http interceptor logiku
  refreshTokens(accesToken: string, refreshToken: string): Observable<any> {
    const tokens = { accesToken, refreshToken };
    return this.http.post<any>(`${this.apiUrl}refresh-token`, tokens).pipe(
      tap(response => {
        this.storeTokens(response);
      })
    );
  }


  logout(): void {
    this.userId$.next(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/login']);
    this.loggedOut$.next(true);   
  }

  // logoutDynamic():void{
  //   localStorage.removeItem('access_token');
  //   localStorage.removeItem('refresh_token');
  //   this.router.navigate(['/login']);
  //   this.logoutSubject$.next()
  // }

  // get logout$(): Observable<void>{
  //   return this.logoutSubject$.asObservable();
  // }

  //token logic
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private storeTokens(tokens: any): void {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken)
  }

  //userId logic
  extractUserId(): number | null {
    const accessToken = this.getAccessToken();
    if (accessToken) {
      const decodedToken = this.jwtHelper.decodeToken(accessToken);
      if (decodedToken && decodedToken.userId !== undefined && decodedToken.userId !== null) {
        return +decodedToken.userId;
      }
    }
    // Return a default value or throw an error if necessary
    return null; // Default value
  }




  //check if the user is logged in for the purpose of authGuard
  isLoggedIn():boolean{
    const accessToken = this.getAccessToken();
    return !!accessToken && !this.jwtHelper.isTokenExpired(accessToken);
  }

  

}
