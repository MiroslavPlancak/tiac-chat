import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

  constructor(private authService:AuthService, private router:Router) { }
  
  canActivate(
     route: ActivatedRouteSnapshot,
     state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
     
      if(this.authService.isLoggedIn()){
        return true
      }else{
        console.log("RouteGuard activated! Need to login before you can access this page.")
        return this.router.parseUrl('/login')
      }
  }


}
