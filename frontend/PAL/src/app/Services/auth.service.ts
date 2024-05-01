import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { UserRegister } from '../Components/register-user/register-user.component';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = "http://localhost:5008/api/AuthController/";

 

  
  public userId$ = new BehaviorSubject<number | null>(null);
  public accessTokenExpirationTimer = new BehaviorSubject<number>(0);
  public refreshTokenStatus = new BehaviorSubject<boolean>(true)
  public loggedOut$ = new Subject<boolean>();
  // private logoutSubject$ = new Subject<void>();
  public tokenRefreshTimer$!: BehaviorSubject<any>;
  public updateTokenRefreshTimer$  = new BehaviorSubject<number>(0);

  constructor(

    private http: HttpClient,
    private router: Router,
    private jwtHelper: JwtHelperService,
   

  ) {
    
    this.userId$.next(this.extractUserId());

    //instantiate tokenRefreshTimer bs
    this.tokenRefreshTimer$ = new BehaviorSubject<any>(null);
    console.log(`BS exp time:`, this.accessTokenExpirationTimer.value)

    // setTimeout(() => {
    //   this.refreshTokens(this.getAccessToken() as string, this.getRefreshToken() as string)
    // }, this.accessTokenExpirationTimer.value);
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
  refreshTokens(accessToken: string, refreshToken: string): Observable<any> {
    const body = {
      accessToken: accessToken,
      refreshToken: refreshToken
    };
    return this.http.post<any>(`${this.apiUrl}refresh-token`, body).pipe(
      tap(response => {
        
        console.log('Response from refresh token request:', response);
        this.storeTokens(response);
        this.refreshTokenStatus.next(response.isRefreshTokenValid)

      })
    );
  }
  


  logout(): void {
    this.userId$.next(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/login']);
    this.loggedOut$.next(true);   
   // window.location.reload();
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

  getRefreshTokenStatus(): string | null {
    return localStorage.getItem(`isRefreshTokenValid`);
  }

  public storeTokens(tokens: any): void {
    localStorage.removeItem('access_token'); 
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    localStorage.setItem('isRefreshTokenValid', tokens.isRefreshTokenValid)
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

  getAccessTokenExpTime():any{
    const accessToken = this.getAccessToken()
    if(accessToken){
      const decodedToken = this.jwtHelper.decodeToken(accessToken);

      console.log(`created time:`, decodedToken.nbf)
      console.log(`expiration time:`, decodedToken.exp)
      console.log(`token duration calc:`, decodedToken.exp - decodedToken.nbf)

        const expirationTime = decodedToken.exp - decodedToken.nbf;

        this.accessTokenExpirationTimer.next(expirationTime)
        
        this.updateTokenRefreshTimer$.next(expirationTime)
    }
  }



  //check if the user is logged in for the purpose of authGuard
  isLoggedIn():boolean{
    const accessToken = this.getAccessToken();
    console.log(`isLoggedIn() activated, access token log:`,accessToken)
    console.log(`is token expired`, this.jwtHelper.isTokenExpired(accessToken))
    return !!accessToken && !this.jwtHelper.isTokenExpired(accessToken);
  }

  

}
