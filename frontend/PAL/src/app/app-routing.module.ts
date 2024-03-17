import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './Components/login/login.component';
import { ChatComponent } from './Components/chat/chat.component';
import { ChatMatComponent } from './Components/chat-mat/chat-mat.component';
import { AuthGuardService } from './Services/auth-guard.service';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component:LoginComponent },
  { path: 'chat', component:ChatComponent, canActivate:[AuthGuardService] },
  { path: 'chatMat', component:ChatMatComponent, canActivate:[AuthGuardService]}
 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
