//Modules
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CdkVirtualScrollable, ScrollingModule } from '@angular/cdk/scrolling';

//Components 
import { CreateChannelComponent } from './Components/create-channel/create-channel.component';
import { ChatMatComponent } from './Components/chat-mat/chat-mat.component';
import { ChatComponent } from './Components/chat/chat.component';
import { LoginComponent } from './Components/login/login.component';

//Services
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatService } from './Services/chat.service';
import { AuthService } from './Services/auth.service';
import { UserService } from './Services/user.service';


//jwt 
import { JwtModule } from '@auth0/angular-jwt';
import { AuthInterceptorService } from './Services/auth-interceptor.service';



//angular material
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListItemLine, MatListModule, MatSelectionList } from '@angular/material/list';
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from '@angular/material/icon';
import { RegisterUserComponent } from './Components/register-user/register-user.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AddUserToPrivateChannelComponent } from './Components/add-user-to-private-channel/add-user-to-private-channel.component';
import { MatSelectModule } from '@angular/material/select';
import { NotificationDialogComponent } from './Components/notification-dialog/notification-dialog.component';
import { UserInfoComponent } from './Components/user-info/user-info.component';
import { OnlineUsersComponent } from './Components/online-users/online-users.component';
import { OfflineUsersComponent } from './Components/offline-users/offline-users.component';
import { PublicChannelsComponent } from './Components/public-channels/public-channels.component';
import { ChatHeaderComponent } from './Components/chat-header/chat-header.component';
import { ChatBodyComponent } from './Components/chat-body/chat-body.component';
import { ChatCommandsComponent } from './Components/chat-commands/chat-commands.component';

//state
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { UserEffect } from './state/user/user.effect';
import { userReducer } from './state/user/user.reducer';
import { channelReducer } from './state/channel/channel.reducer';
import { ChannelEffect } from './state/channel/channel.effect';


@NgModule({
  declarations: [
    AppComponent,
    ChatComponent,
    LoginComponent,
    ChatMatComponent,
    CreateChannelComponent,
    RegisterUserComponent,
    AddUserToPrivateChannelComponent,
    NotificationDialogComponent,
    UserInfoComponent,
    OnlineUsersComponent,
    OfflineUsersComponent,
    PublicChannelsComponent,
    ChatHeaderComponent,
    ChatBodyComponent,
    ChatCommandsComponent,
  
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    CommonModule,
   ScrollingModule,
    JwtModule.forRoot({
      config: {
          tokenGetter: () => {
            return localStorage.getItem('access_token');
          }        
      }
    }),
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatListItemLine,
    MatDialogModule,
    MatIconButton,
    MatIconModule,
    MatError,
    MatTooltipModule,
    MatSelectModule,
    StoreModule.forRoot({userReducer,channelReducer}, {}),
    EffectsModule.forRoot([UserEffect, ChannelEffect]),
  

  ],
  providers: [
    ChatService,
    AuthService,
    UserService,
    
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]

})
export class AppModule { }
