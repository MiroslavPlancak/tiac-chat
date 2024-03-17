import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { NotificationDialogComponent } from '../Components/notification-dialog/notification-dialog.component';


@Injectable({
  providedIn: 'root'
})
export class NotificationDialogService {

  constructor(private dialog: MatDialog) { }
  public dialogCollection: MatDialogRef<NotificationDialogComponent>[] = [];

  openNotificationDialog(title: string, message: string, buttonText: string): MatDialogRef<NotificationDialogComponent> {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      title: title,
      message: message,
      buttonText: buttonText,
      buttonExists: true
    }
    const dialogRef = this.dialog.open(NotificationDialogComponent, dialogConfig)
    this.dialogCollection.push(dialogRef)
    return dialogRef;
  }

  openOnlineNotification(
    message: string,
    messageColor?: string,
    messageTransform?: string,
    position?: { top: string, left: string },
    duration?: number
  ): MatDialogRef<NotificationDialogComponent> {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.hasBackdrop = false;
   
    

    if(position){
      dialogConfig.position = {top: position.top, left: position.left}
    }
    if(duration){
      setTimeout(() => {
        dialogRef.close();
        this.removeDialogRef(dialogRef)
      }, duration);
    }
    dialogConfig.data = {
      titleExists: false,
      message: message,
      buttonExists: false,
      messageColor: messageColor || '#7986cb',
      messageTransform: messageTransform || 'skew(-20deg)'
    }
   const dialogRef=  this.dialog.open(NotificationDialogComponent, dialogConfig)
   this.dialogCollection.push(dialogRef)
   return dialogRef;
  }
  removeDialogRef(dialogRef: MatDialogRef<NotificationDialogComponent, any>) {
   const index = this.dialogCollection.indexOf(dialogRef)
   if(index < -1 ){
    this.dialogCollection.splice(index,1)
   }
  }
  
  closeAllDialogs() {
    this.dialogCollection.forEach(dialog => dialog.close());
    this.dialogCollection = [];
  }

}
