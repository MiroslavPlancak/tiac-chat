import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-notification-dialog',
  templateUrl: './notification-dialog.component.html',
  styleUrl: './notification-dialog.component.css'
})
export class NotificationDialogComponent {



  constructor(
    public dialogRef: MatDialogRef<NotificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      title:string, 
      message:string, 
      buttonText: string, 
      buttonExists:boolean, 
      titleExists:boolean,
      messageColor:string,
      messageTransform:string,
    }
  ){}
  
  onClose() {
    this.dialogRef.close();
    }
}
